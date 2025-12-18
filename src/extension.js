const vscode = require('vscode');
const {createPreview} = require('./markutil');


function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand('markmap.preview', () => createPreview(context))
  );
}

function deactivate() {}

module.exports = { activate, deactivate };
