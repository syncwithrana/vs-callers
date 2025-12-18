const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

let bottomViewColumn = null;

async function ensureBottomGroup() {
  // Step 1: ensure at least one editor group exists
  if (vscode.window.visibleTextEditors.length === 0) {
    await vscode.commands.executeCommand('workbench.action.newUntitledFile');
  }

  // Step 2: create bottom split ONCE
  if (!bottomViewColumn) {
    await vscode.commands.executeCommand(
      'workbench.action.splitEditorDown'
    );

    // active editor is now in bottom group
    bottomViewColumn = vscode.window.activeTextEditor.viewColumn;
  }
}

async function createPreviewUtil(extensionPath, getTags)  {
     await ensureBottomGroup();
     const panel = vscode.window.createWebviewPanel(
        'markmapPreview',
        'Markmap Preview',
        bottomViewColumn ?? vscode.ViewColumn.Active,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
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
