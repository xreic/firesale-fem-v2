const fs = require('fs');

// Destructure the functionality we want from the "electron" object
const { app, BrowserWindow, dialog, Menu } = require('electron');

// Variable where the program will "live"
let mainWindow = null;

app.on('ready', () => {
  // Default the app to not show
  mainWindow = new BrowserWindow({ show: false });

  // Custom menu
  // Will remove/override all default hotkeys + keyboard shortcuts
  Menu.setApplicationMenu(applicationMenu);

  // Load the HTML + CSS
  mainWindow.loadFile(`${__dirname}/index.html`);

  // Once the HTML + CSS have loaded then show
  // This is the skip the white flash while the HTML + CSS are loading on start up
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
});

exports.getFileFromUser = () => {
  // Save into the variable the return of whatever is selected in the file picker as an array
  const files = dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    buttonLabel: 'Unveil',
    title: 'Open Fire Sale Document',
    filters: [
      {
        name: 'Markdown Files',
        extensions: ['md', 'mdown', 'markdown', 'marcdown'],
      },
      {
        name: 'Text Files',
        extensions: ['txt', 'text'],
      },
    ],
  });

  // Early return when no files are selected
  if (!files) return;

  // Pick and read only the first file from the selection
  const file = files[0];
  openFile(file);
};

exports.saveMarkdown = (file, content) => {
  // When there is no file to save towards
  // prompt them to figure a path out
  if (!file) {
    file = dialog.showSaveDialog(mainWindow, {
      title: 'Save Markdown',
      defaultPath: app.getPath('desktop'),
      filters: [
        {
          name: 'Markdown Files',
          extensions: ['md', 'markdown', 'mdown', 'marcdown'],
        },
      ],
    });
  }

  // In case they ignore setting up a save path
  if (!file) {
    return;
  }

  fs.writeFileSync(file, content);
  openFile(file);
};

exports.saveHtml = (content) => {
  const file = dialog.showSaveDialog(mainWindow, {
    title: 'Save HTML',
    defaultPath: app.getPath('desktop'),
    filters: [{ name: 'HTML Files', extensions: ['html', 'htm'] }],
  });

  if (!file) return;

  fs.writeFileSync(file, content);
};

const openFile = (exports.openFile = (file) => {
  const content = fs.readFileSync(file).toString();

  // add the opened file to the list of recent items
  app.addRecentDocument(file);

  // first argument is an arbitrary message string to be read
  mainWindow.webContents.send('file-opened', file, content);
});

const template = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Open File',
        accelerator: 'CommandOrControl+O',
        click() {
          exports.getFileFromUser();
        },
      },
      {
        label: 'Save File',
        accelerator: 'CommandOrControl+S',
        click() {
          mainWindow.webContents.send('save-markdown');
        },
      },
      {
        label: 'Copy',
        role: 'copy',
      },
    ],
  },
];

if (process.platform === 'darwin') {
  const applicationName = 'Fire Sale';

  template.unshift({
    label: applicationName,
    submenu: [
      { label: `About ${applicationName}`, role: 'about' },
      {
        label: `Quit ${applicationName}`,
        role: 'quit',
      },
    ],
  });
}

const applicationMenu = Menu.buildFromTemplate(template);
