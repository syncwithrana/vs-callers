const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

function createPreview(extensionPath)  {
      const panel = vscode.window.createWebviewPanel(
        'markmapPreview',
        'Markmap Preview',
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          localResourceRoots: [
            vscode.Uri.file(path.join(extensionPath, 'media'))
          ]
        }
      );

      const htmlPath = path.join(extensionPath, 'media', 'index.html');
      let html = fs.readFileSync(htmlPath, 'utf8');

      const webview = panel.webview;
      const mediaPath = webview.asWebviewUri(
        vscode.Uri.file(path.join(extensionPath, 'media'))
      );

      html = html
        .replace(/href="treeview.css"/g, `href="${mediaPath}/treeview.css"`)
        .replace(/src="treeview.js"/g, `src="${mediaPath}/treeview.js"`);

      panel.webview.html = html;
    }

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand('markmap.preview', () => createPreview(context.extensionPath))
  );
}

function deactivate() {}

module.exports = { activate, deactivate };
