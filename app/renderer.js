const path = require('path');
const marked = require('marked');
const { remote, ipcRenderer } = require('electron');

let filePath = null;
let originalContent = '';

const mainProc = remote.require('./main');
const currentWindow = remote.getCurrentWindow();

const markdownView = document.querySelector('#markdown');
const htmlView = document.querySelector('#html');
const newFileButton = document.querySelector('#new-file');
const openFileButton = document.querySelector('#open-file');
const saveMarkdownButton = document.querySelector('#save-markdown');
const revertButton = document.querySelector('#revert');
const saveHtmlButton = document.querySelector('#save-html');
const showFileButton = document.querySelector('#show-file');
const openInDefaultButton = document.querySelector('#open-in-default');

const renderMarkdownToHtml = (markdown) => {
  htmlView.innerHTML = marked(markdown, { sanitize: true });
};

const updateUserInterface = (isEdited) => {
  let title = 'Fire Sale';

  if (filePath) {
    title = `${path.basename(filePath)} - ${title}`;
  }

  if (isEdited) {
    title = `${title} - Edited`;
  }

  /**
   * MacOS stuff
   * Icon within the title bar
   * Close button will have a dot within it if there are edits
   */
  if (filePath) {
    // To guard the case of saving a new file where no path exists
    currentWindow.setRepresentedFilename(filePath);
  }
  currentWindow.setDocumentEdited(isEdited);

  saveMarkdownButton.disabled = !isEdited;
  revertButton.disabled = !isEdited;

  currentWindow.setTitle(title);
};

// Every key up triggers this to update the left and right text views
markdownView.addEventListener('keyup', (event) => {
  const currentContent = event.target.value;

  renderMarkdownToHtml(currentContent);
  updateUserInterface(currentContent !== originalContent);
});

openFileButton.addEventListener('click', () => {
  mainProc.getFileFromUser();
});

saveMarkdownButton.addEventListener('click', () => {
  mainProc.saveMarkdown(filePath, markdownView.value);
});

// ipc = interprocess communication
// arguments in callback are always event and
//   then all the other parameters of the corresponding webContents.send call
ipcRenderer.on('file-opened', (event, file, content) => {
  filePath = file;
  originalContent = content;

  markdownView.value = content;
  renderMarkdownToHtml(content);

  updateUserInterface(false);
});
