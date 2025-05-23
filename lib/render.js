const vscode = require('vscode');
const path = require('path');

/**
 * Handles rendering the MUD view in a webview.  Implements the
 * WebviewViewProvider interface to be registered directly with VSCode.
 */
class MUDRenderer {
  /**
   * Creates a new instance of the MUDRenderer.
   *
   * @param {vscode.ExtensionContext} context - The extension context.
   * @param {MUDState} state - The central state manager.
   */
  constructor(context, state) {
    this.context = context;
    this.state = state;
    this.webviewView = null;
    this.messageHandler = null;
  }

  /**
   * Disposes of resources used by the renderer.
   */
  dispose() {
    this.webviewView = null;
    this.messageHandler = null;

    if (this.onDidReceiveMessage) {
      this.onDidReceiveMessage.dispose();
      this.onDidReceiveMessage = null;
    }
  }

  /**
   * Required method for WebviewViewProvider interface.
   *
   * Called when the webview view is first created or when it becomes visible
   * again after being hidden.
   *
   * @param {vscode.WebviewView} webviewView - The webview view to resolve.
   */
  resolveWebviewView(webviewView) {
    this.webviewView = webviewView;

    // Configure the webview
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri]
    };

    this.update()

    // Set up message handler
    /*
    webviewView.webview.onDidReceiveMessage(message => {
      if (this.messageHandler) {
        this.messageHandler(message);
      }
    });
    */
  }

  /**
   * Sets the message handler for the webview.
   * @param {Function} handler - The message handler function.
   */
  setMessageHandler(handler) {
    this.messageHandler = handler;
  }

  /**
   * Updates the renderer with the current state.
   */
  update() {
    // Update the webview if it exists
    if (this.webviewView && this.webviewView.webview) {
      // Set the HTML content
      this.webviewView.webview.html = this.getHtmlForWebview(this.webviewView.webview);

      /*
      this.webviewView.webview.postMessage({
        type: 'updateState',
        state: state
      });
      */
    }
  }

  /**
   * Gets the HTML content for the webview.
   *
   * @param {vscode.Webview} webview - The webview to get HTML for.
   * @returns {string} The HTML content.
   * @private
   */
  getHtmlForWebview(webview) {
    // Get the local path to the webview files and convert it to a URI
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'styles.css')
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'main.js')
    );

    const currentRoom = this.state.rooms.get(this.state.currentRoomId) || {}

    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>MUD View</title>
        <style>
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
          .debug-box {
            width: 100%;
            height: 200px;
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
            <button class="map-control-btn ${this.state.mappingEnabled ? 'active' : ''}" id="toggleMapping">
              ${this.state.mappingEnabled ? 'Disable' : 'Enable'} Mapping
            </button>
            <button class="map-control-btn" id="resetMap">Reset Map</button>
          </div>

          <div class="map-placeholder">
            Mapping visualization will be implemented here
          </div>

          <div class="debug-section">
            <h3>Current Room: ${currentRoom?.name || 'Unknown'}</h3>
            <p>Exits: ${currentRoom?.exits?.length > 0 ? currentRoom?.exits?.join(', ') : 'None'}</p>
            <p>Last Command: <code>${this.state.lastCommand || 'None'}</code></p>
          </div>

          <div class="debug-section">
            <h3>Debug Information</h3>
            <textarea readonly class="debug-box">${JSON.stringify(this.state, null, 2)}</textarea>
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
}

module.exports = MUDRenderer;
