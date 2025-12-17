const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

let bottomViewColumn = null;

function createPreviewUtil(extensionPath, getTags)  {
     const panel = vscode.window.createWebviewPanel(
        'markmapPreview',
        'Markmap Preview',
        bottomViewColumn ?? vscode.ViewColumn.Active,
        {
          enableScripts: true,
          localResourceRoots: [
            vscode.Uri.file(path.join(extensionPath, 'media'))
          ]
        }
      );

       if (!bottomViewColumn) {
        vscode.commands.executeCommand(
          'workbench.action.moveEditorToBelowGroup'
        ).then(() => {
          bottomViewColumn = panel.viewColumn;
        });
    }

      vscode.commands.executeCommand(
        'workbench.action.moveEditorToBelowGroup'
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
      panel.webview.onDidReceiveMessage(msg => {
        if (msg.type === 'getTags') {
          panel.webview.postMessage({
            type: 'getTags:response',
            id: msg.id,
            data: getTags(msg.tagName)
          });
        }
      });
    }

module.exports = { createPreviewUtil };
