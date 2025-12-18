const vscode = require('vscode');
const {createPreviewUtil} = require('./webPanel');

function getTagsRef(tagName) {
  const n = Math.floor(Math.random() * 5) + 3;
  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
  return letters.slice(0, tagName);
}

async function createPreview(context)  {
  await createPreviewUtil(context.extensionPath, getTagsRef);
}

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand('markmap.preview', () => createPreview(context))
  );
}

function deactivate() {}

module.exports = { activate, deactivate };
