const vscode = require('vscode');
const { extractRoomInfo } = require('./lib/room-parser');

/**
 * Provides a webview for displaying MUD output and sending commands.
 */
class MudViewProvider {
  /**
   * Creates a new instance of the MudViewProvider.
   * @param {vscode.ExtensionContext} context - The extension context.
   */
  constructor(context) {
    this._disposables = [];
    this._exits = [];
    this._lastCommand = '';
    this._pendingLastCommand = '';
    this._terminal = null;
    this._roomName = '';
    this._roomInfo = null;
    this._view = null;
    this._exitCount = 0;

    // Mapping state
    this._mappingEnabled = false;  // Start with mapping disabled
    this._lastRoomDescription = ''; // Store the full room description for debugging
    
    // Will be used for the directed graph implementation
    this._map = {
      rooms: {},
      currentRoomId: null,
      history: []
    };
  }

  /**
   * Called when the webview view is created or restored.
   * @param {vscode.WebviewView} webviewView - The webview view to be resolved.
   */
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
        case 'mapControl':
          switch (message.action) {
            case 'reset':
              this._resetMap();
              this._updateWebview();
              break;
            case 'toggleMapping':
              this._mappingEnabled = !this._mappingEnabled;
              console.log(`Mapping ${this._mappingEnabled ? 'enabled' : 'disabled'}`);
              this._updateWebview();
              break;
            case 'zoomIn':
            case 'zoomOut':
              // These are handled client-side
              break;
          }
          return;
      }
    });

    // Start watching the terminal
    this._watchTerminal();
  }

  /**
   * Sends a command to the terminal.
   * @param {string} text - The command text to send.
   */
  _sendCommandToTerminal(text) {
    if (this._terminal) {
      this._terminal.sendText(text + '\n');
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

  /**
   * Watches the terminal for output.
   */
  _watchTerminal() {
    vscode.window.onDidStartTerminalShellExecution(async executionStartEvent => {
      console.log('Terminal execution started');
      const execution = executionStartEvent.execution;
      const stream = execution.read();

      // Save terminal reference
      if (executionStartEvent.terminal) {
        this._terminal = executionStartEvent.terminal;
        console.log('Terminal reference saved');
      }

      try {
        const reader = await stream;
        console.log('Reader type:', typeof reader, reader);

        // Try reading as a standard async iterator
        if (reader && typeof reader[Symbol.asyncIterator] === 'function') {
          for await (const data of reader) {
            console.log('Received data:', data);
            this._trackUserCommand(data);
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
   * Tracks user commands by analyzing incoming data.
   * @param {string} data - The data received from the terminal.
   */
  _trackUserCommand(data) {
    if (data.length < 5) {
      if (data === '\n' || data === '\r') {
        this._lastCommand = this._pendingLastCommand;
        this._pendingLastCommand = '';
        this._updateWebview();
        console.log('Command entered:', this._lastCommand);
      } else {
        this._pendingLastCommand += data;
      }
    } else if (data.includes('\n') || data.includes('\r')) {
      if (this._pendingLastCommand.length > 0) {
        this._lastCommand = this._pendingLastCommand;
        this._pendingLastCommand = '';
        this._updateWebview();
        console.log('Command entered (multi-char):', this._lastCommand);
      }
    }
  }

  /**
   * Updates the webview with the latest data.
   */
  _updateWebview() {
    if (this._view) {
      this._view.webview.html = this._getHtmlForWebview(this._view.webview);
    }
  }

  /**
   * Processes MUD output to extract room information.
   * @param {string} data - The data to process.
   * @returns {boolean} True if room info was processed, false otherwise.
   */
  _processMudOutput(data) {
    if (!data) return false;

    // Strip ANSI color codes
    const strippedData = data.replace(/\x1B\[([0-9]{1,2}(;[0-9]{1,2})?)?[m|K]/g, '');
    this._lastRoomDescription = strippedData;

    // Use the room parser to extract room information
    const roomInfo = extractRoomInfo(strippedData);

    if (roomInfo) {
      this._roomInfo = roomInfo;
      this._roomName = roomInfo.name;
      
      // Process exits to handle any parentheses (e.g., (n)orth)
      this._exits = (roomInfo.exits || []).map(exit => {
        const match = exit.match(/\(([^)]+)\)/);
        return match ? match[1] : exit;
      });

      console.log('Processed room info:', {
        name: this._roomName,
        exits: this._exits,
        rawExits: roomInfo.exits
      });

      // Update map with room information
      this._updateMapWithRoom(this._roomName);

      // Update map with exits if we have them
      if (this._exits.length > 0) {
        this._exitCount++;
        console.log('Detected exits:', this._exits);
        this._updateMapWithExits(this._exits);
      }

      this._updateWebview();
      return true;
    }

    return false;
  }

  /**
   * Updates the map with room information.
   * @param {string} roomName - The name of the room.
   */
  _updateMapWithRoom(roomName) {
    if (!roomName) return;
    this._roomName = roomName;
    if (this._mappingEnabled) {
      console.log(`[DEBUG] Room update - Name: ${roomName}, Exits: ${this._exits.join(', ')}`);
    }
  }

  /**
   * Updates the map with exit information.
   * @param {string[]} exits - Array of available exit directions.
   */
  _updateMapWithExits(exits) {
    if (!exits || !exits.length || !this._mappingEnabled) return;
    this._exits = [...exits];
    console.log(`[DEBUG] Updated exits: ${exits.join(', ')}`);
  }

  /**
   * Resets the map to its initial state.
   */
  _resetMap() {
    this._map = {
      rooms: {},
      currentRoomId: null,
      history: []
    };
    this._exits = [];
    this._roomName = '';
    this._roomInfo = null;
    console.log('[DEBUG] Map has been reset');
  }

  /**
   * Generates the HTML content for the webview.
   * @param {vscode.Webview} webview - The webview to generate HTML for.
   * @returns {string} The HTML content.
   */
  _getHtmlForWebview(webview) {
    const debugInfo = JSON.stringify({
      mappingEnabled: this._mappingEnabled,
      lastCommand: this._lastCommand,
      roomName: this._roomName,
      exits: this._exits,
      roomInfo: this._roomInfo
    }, null, 2);

    return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>MUD View</title>
        <style>
          body {
            font-family: var(--vscode-font-family);
            padding: 10px;
            margin: 0;
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
          }
          .map-controls {
            margin: 10px 0;
            display: flex;
            gap: 10px;
          }
          .map-control-btn {
            padding: 5px 10px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 2px;
            cursor: pointer;
          }
          .map-control-btn:hover {
            background-color: var(--vscode-button-hoverBackground);
          }
          .map-control-btn.active {
            background-color: var(--vscode-button-secondaryBackground);
          }
          .map-placeholder {
            border: 1px dashed var(--vscode-editor-foreground);
            padding: 40px 20px;
            text-align: center;
            margin: 20px 0;
            color: var(--vscode-descriptionForeground);
            border-radius: 4px;
          }
          .debug-section {
            margin-top: 20px;
            padding: 15px;
            background-color: var(--vscode-editorWidget-background);
            border: 1px solid var(--vscode-widget-border);
            border-radius: 4px;
          }
          .debug-section h3 {
            margin-top: 0;
            color: var(--vscode-textLink-foreground);
            font-size: 14px;
          }
          .debug-info {
            white-space: pre-wrap;
            font-family: var(--vscode-editor-font-family);
            font-size: 12px;
            margin: 0;
            overflow-x: auto;
            background-color: var(--vscode-editor-background);
            padding: 10px;
            border-radius: 3px;
          }
          code {
            font-family: var(--vscode-editor-font-family);
            background-color: var(--vscode-textCodeBlock-background);
            padding: 2px 4px;
            border-radius: 3px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>MUD View</h2>
          
          <!-- Map controls -->
          <div class="map-controls">
            <button class="map-control-btn ${this._mappingEnabled ? 'active' : ''}" id="toggleMapping">
              ${this._mappingEnabled ? 'Disable' : 'Enable'} Mapping
            </button>
            <button class="map-control-btn" id="resetMap">Reset Map</button>
          </div>
        
          <div class="map-placeholder">
            Mapping visualization will be implemented here
          </div>

          <div class="debug-section">
            <h3>Current Room: ${this._roomName || 'Unknown'}</h3>
            <p>Exits: ${this._exits.length > 0 ? this._exits.join(', ') : 'None'}</p>
            <p>Last Command: <code>${this._lastCommand || 'None'}</code></p>
          </div>

          <div class="debug-section">
            <h3>Debug Information</h3>
            <pre class="debug-info">${debugInfo}</pre>
          </div>

          <script>
            const vscode = acquireVsCodeApi();

            // Handle button clicks
            document.getElementById('toggleMapping').addEventListener('click', () => {
              vscode.postMessage({
                command: 'mapControl',
                action: 'toggleMapping'
              });
            });

            document.getElementById('resetMap').addEventListener('click', () => {
              vscode.postMessage({
                command: 'mapControl',
                action: 'reset'
              });
            });
          </script>
        </div>
      </body>
    </html>`;
  }

  /**
   * Disposes of resources used by the provider.
   */
  dispose() {
    this._disposables.forEach(disposable => {
      try {
        disposable.dispose();
      } catch (e) {
        console.error('Error disposing:', e);
      }
    });
    this._disposables = [];
  }
}

/**
 * Activates the extension.
 * @param {vscode.ExtensionContext} context - The extension context.
 */
function activate(context) {
  // Register the webview view provider
  const mudViewProvider = new MudViewProvider(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('mudView', mudViewProvider)
  );

  // Register command to show the view
  const disposable = vscode.commands.registerCommand('popt-mud.showMudView', async () => {
    await vscode.commands.executeCommand('workbench.view.extension.mud-explorer');
    vscode.window.showInformationMessage('MUD View activated!');
  });
  context.subscriptions.push(disposable);
}

/**
 * Deactivates the extension.
 */
function deactivate() {}

module.exports = {
  activate,
  deactivate
};
