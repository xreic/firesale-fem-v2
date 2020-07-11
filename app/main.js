// Destructure the functionality we want from the "electron" object
const { app, BrowserWindow } = require('electron');

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
