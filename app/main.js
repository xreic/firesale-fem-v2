const fs = require('fs');

// Destructure the functionality we want from the "electron" object
const { app, BrowserWindow, dialog } = require('electron');

// Variable where the program will "live"
let mainWindow = null;

app.on('ready', () => {
  // Default the app to not show
  mainWindow = new BrowserWindow({ show: false });

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
  const files = dialog.showOpenDialog({
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
  const content = fs.readFileSync(file).toString();

  console.log(content);
};
