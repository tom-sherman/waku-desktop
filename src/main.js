const { app, BrowserWindow, protocol } = require("electron");
const path = require("path");
const fs = require("fs/promises");

protocol.registerSchemesAsPrivileged([
  {
    scheme: "waku",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      bypassCSP: true,
    },
  },
]);

Promise.all([import("./waku-shim.mjs"), app.whenReady()]).then(
  ([{ handleWakuRequest }]) => {
    protocol.handle("waku", (req) => {
      return handleWakuRequest(req);
    });

    protocol.handle("file", async (req) => {
      const url = new URL(req.url);
      if (url.pathname.startsWith("/RSC")) {
        return handleWakuRequest(req);
      }

      if (url.pathname.startsWith("/assets")) {
        url.pathname = path.join(__dirname, "../dist/public") + url.pathname;
      }

      const headers = new Headers();
      if (url.pathname.endsWith(".html")) {
        headers.set("Content-Type", "text/html");
      } else if (url.pathname.endsWith(".js")) {
        headers.set("Content-Type", "application/javascript");
      }

      return new Response(await fs.readFile(url.pathname), {
        headers,
      });
    });

    createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  }
);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      contextIsolation: true,
    },
  });

  win.loadFile(path.join(__dirname, "../dist/public/index.html"));
  win.webContents.openDevTools();
}
