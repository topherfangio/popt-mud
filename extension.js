const vscode = require('vscode');
const MUDSessionManager = require('./lib/manager');

// Global reference to the manager
let mudSessionManager;

/**
 * Activates the extension.
 * @param {vscode.ExtensionContext} context - The extension context.
 */
async function activate(context) {
  console.log('Activating POPT MUD extension');

  try {
    // Initialize the MUD session manager
    mudSessionManager = new MUDSessionManager(context);

    // Register commands
    context.subscriptions.push(
      vscode.commands.registerCommand('popt-mud.sendCommand', (command) => {
        if (mudSessionManager) {
          mudSessionManager.handleCommand(command);
        }
      })
    );

    // Register webview view provider
    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(
        'mudView',
        mudSessionManager.renderer
      )
    );

    // Show welcome message
    vscode.window.showInformationMessage('POPT MUD extension activated!');
    console.log('POPT MUD extension activated');
  } catch (error) {
    console.error('Failed to activate POPT MUD extension:', error, error.stack);
    vscode.window.showErrorMessage('Failed to activate POPT MUD extension. See console for details.');
  }
}

/**
 * Deactivates the extension.
 */
function deactivate() {
  console.log('Deactivating POPT MUD extension');

  if (mudSessionManager) {
    mudSessionManager.dispose();
    mudSessionManager = null;
  }

  console.log('POPT MUD extension deactivated');
}

// Export the activate and deactivate functions
module.exports = {
  activate,
  deactivate
};

/**
 * Deactivates the extension.
 */
function deactivate() {}

module.exports = {
  activate,
  deactivate
};
