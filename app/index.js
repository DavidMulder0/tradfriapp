const { app, BrowserWindow } = require('electron')
app.allowRendererProcessReuse = true;
function createWindow () {
  // Create the browser window.
  let win = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    webPreferences: {
      nodeIntegration: true
    }
  })
  // win.webContents.openDevTools();

  // and load the index.html of the app.
  win.loadFile('index.html')
}

app.whenReady().then(createWindow)