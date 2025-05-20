const vscode = require('vscode');

class MudViewProvider {
  constructor(context) {
    this._disposables = [];
    this._exitCount = 0;
    this._exits = [];
    this._lastCommand = '';
    this._pendingLastCommand = '';
    this._terminal = null;
  }

  resolveWebviewView(webviewView) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      retainContextWhenHidden: true
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(message => {
      switch (message.command) {
        case 'alert':
          vscode.window.showInformationMessage(message.text);
          return;
        case 'sendCommand':
          this._sendCommandToTerminal(message.text);
          return;
      }
    });

    // Start watching the terminal
    this._watchTerminal();
  }

  /**
   * Send a command to the terminal
   * @param {string} text - The text command to send
   */
  _sendCommandToTerminal(text) {
    if (this._terminal) {
      this._terminal.sendText(text + '\n');

      // Also update our last command
      this._lastCommand = text;
      this._updateWebview();

      console.log('Sent command to terminal:', text);
    } else {
      console.log('No terminal available to send command');

      // Fallback method if terminal reference is not available
      vscode.window.terminals.forEach(terminal => {
        if (terminal.name.includes('MUD') || terminal.name === 'Terminal') {
          terminal.sendText(text + '\n');
          this._terminal = terminal;
          this._lastCommand = text;
          this._updateWebview();
          console.log('Found and used terminal:', terminal.name);
        }
      });
    }
  }

  _watchTerminal() {
    vscode.window.onDidStartTerminalShellExecution(async executionStartEvent => {
      console.log("Terminal execution started");
      const execution = executionStartEvent.execution;
      const stream = execution.read();

      this._terminal = executionStartEvent.terminal;

      try {
        // Let's examine what we get
        const reader = await stream;
        console.log('Reader type:', typeof reader, reader);

        // Try reading as a standard async iterator
        if (reader && typeof reader[Symbol.asyncIterator] === 'function') {
          for await (const data of reader) {
            console.log(' *** data: ', data);

            // Track user commands
            this._trackUserCommand(data);

            // Process MUD output
            this._processMudOutput(data);
          }
        } else {
          console.log('Stream reader is not an async iterator');
        }
      } catch (err) {
        console.error('Error reading terminal stream:', err);
      }
    });
  }

  /**
   * Track user commands by analyzing incoming data
   * @param {string} data - The data received from the terminal
   */
  _trackUserCommand(data) {
    // If the data is very short, it's likely user input
    if (data.length < 5) {
      // Check if it's a newline or return character
      if (data === '\n' || data === '\r') {
        // Set the last command and update the webview
        this._lastCommand = this._pendingLastCommand;
        this._pendingLastCommand = '';
        this._updateWebview();

        console.log('Command entered:', this._lastCommand);
      } else {
        // Add the character to pending command
        this._pendingLastCommand += data;
      }
    } else if (data.includes('\n') || data.includes('\r')) {
      // If multi-character data contains a newline, it might be the end of a command
      // This handles cases where multiple characters might be sent at once
      if (this._pendingLastCommand.length > 0) {
        this._lastCommand = this._pendingLastCommand;
        this._pendingLastCommand = '';
        this._updateWebview();

        console.log('Command entered (multi-char):', this._lastCommand);
      }
    }
  }

  _updateWebview() {
    if (this._view) {
      this._view.webview.html = this._getHtmlForWebview(this._view.webview);
    }
  }

  // Process MUD output and extract exits
  _processMudOutput(data) {
    if (!data) return;

    // Check for exits in the output
    const exitMatch = data.match(/Obvious Exits: ([\w ]+)/i);
    if (exitMatch) {
      this._exitCount++;
      const exitsText = exitMatch[1].trim();
      this._exits = exitsText.split(' ');
      this._updateWebview();
      return true; // Indicates that exits were found
    }
    return false; // No exits found
  }

  _getHtmlForWebview(webview) {
    return `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            background-color: var(--vscode-sideBar-background);
            color: var(--vscode-foreground);
            margin: 0;
            height: 100%;
            box-sizing: border-box;
            overflow: auto;
          }
          h1 {
            color: var(--vscode-textLink-foreground);
            margin-top: 0;
            padding-top: 10px;
          }
          .container {
            max-width: 100%;
            padding: 0 10px;
          }
          .counter {
            font-size: 24px;
            font-weight: bold;
            color: var(--vscode-textLink-foreground);
            margin: 10px 0;
          }
          .exits-container {
            margin: 15px 0;
          }
          .exits {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
            margin-top: 8px;
          }
          .exit-tag {
            display: inline-block;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 0.9em;
            cursor: pointer;
            transition: background-color 0.2s;
          }
          .exit-tag:hover {
            background-color: var(--vscode-button-hoverBackground);
          }
          .command-container {
            margin: 15px 0;
          }
          .command {
            font-family: var(--vscode-editor-font-family);
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            padding: 8px 12px;
            border-radius: 4px;
            border: 1px solid var(--vscode-editorWidget-border);
            white-space: pre-wrap;
            word-break: break-all;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Popt MUD Tools</h1>
          <p>Watching for MUD exits...</p>
          <div class="counter">Exits found: ${this._exitCount}</div>
          ${this._lastCommand ? `
            <div class="command-container">
              <h3>Last Command:</h3>
              <div class="command">${this._lastCommand}</div>
            </div>
          ` : ''}
          ${this._exits.length > 0 ? `
            <div class="exits-container">
              <h3>Available Exits:</h3>
              <div class="exits">
                ${this._exits.map(exit => `<span class="exit-tag" onclick="sendCommand('${exit}')">${exit}</span>`).join('')}
              </div>
            </div>
          ` : ''}
          <p>Connect to your MUD in the terminal below.</p>
        </div>
        <script>
          // Handle messages from the extension
          const vscode = acquireVsCodeApi();

          // Function to send a command to the terminal
          function sendCommand(command) {
            vscode.postMessage({
              command: 'sendCommand',
              text: command
            });
          }
        </script>
      </body>
      </html>`;
  }

  dispose() {
    this._disposables.forEach(d => {
      try {
        d.dispose();
      } catch (e) {
        console.error('Error disposing:', e);
      }
    });
    this._disposables = [];
  }
}

function activate(context) {
  // Register the webview view provider
  const mudViewProvider = new MudViewProvider(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('mudView', mudViewProvider)
  );

  // Register command to show the view
  let disposable = vscode.commands.registerCommand('popt-mud.showMudView', async function () {
    // Show the view
    await vscode.commands.executeCommand('workbench.view.extension.mud-explorer');
    vscode.window.showInformationMessage('MUD View activated!');
  });

  context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
