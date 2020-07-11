const path = require('path');
const marked = require('marked');
const { remote, ipcRenderer, shell } = require('electron');

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

  showFileButton.disabled = !filePath;
  openInDefaultButton.disabled = !filePath;

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

/**
 * Saving as markdown
 */
const saveMarkdown = () => {
  mainProc.saveMarkdown(filePath, markdownView.value);
};
saveMarkdownButton.addEventListener('click', saveMarkdown);
ipcRenderer.on('save-markdown', saveMarkdown);

/**
 * Saving as HTML
 */
const saveHtml = () => {
  mainProc.saveHtml(htmlView.innerHTML);
};
saveHtmlButton.addEventListener('click', saveHtml);
ipcRenderer.on('save-html', saveHtml);

/**
 * Default file opening action
 */
openFileButton.addEventListener('click', () => {
  mainProc.getFileFromUser();
});

/**
 * Alternative file opening operations
 */
showFileButton.addEventListener('click', () => {
  if (!filePath) {
    return alert('No');
  }

  shell.showItemInFolder(filePath);
});

openInDefaultButton.addEventListener('click', () => {
  if (!filePath) {
    return alert('No');
  }

  shell.openItem(filePath);
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

// prevent drag and drop
document.addEventListener('dragstart', (event) => event.preventDefault());
document.addEventListener('dragover', (event) => event.preventDefault());
document.addEventListener('dragleave', (event) => event.preventDefault());
document.addEventListener('drop', (event) => event.preventDefault());

// setting up drag and drop
const getDraggedFile = (event) => event.dataTransfer.items[0];
const getDroppedFile = (event) => event.dataTransfer.files[0];
const fileTypeIsSupported = (file) => {
  return ['text/plain', 'text/markdown'].includes(file.type);
};

markdownView.addEventListener('dragover', (event) => {
  const file = getDraggedFile(event);

  if (fileTypeIsSupported(file)) {
    markdownView.classList.add('drag-over');
  } else {
    markdownView.classList.add('drag-error');
  }
});

markdownView.addEventListener('dragleave', () => {
  markdownView.classList.remove('drag-over');
  markdownView.classList.remove('drag-error');
});

markdownView.addEventListener('drop', (event) => {
  const file = getDroppedFile(event);

  if (fileTypeIsSupported(file)) {
    mainProc.openFile(file.path);
  } else {
    alert('That file type is not supported.');
  }

  markdownView.classList.remove('drag-over');
  markdownView.classList.remove('drag-error');
});
