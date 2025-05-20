const vscode = require('vscode');
class MudViewProvider {
  constructor(context) {
    this._disposables = [];
    this._exitCount = 0;
    this._exits = [];
    this._lastCommand = '';
    this._pendingLastCommand = '';
    this._terminal = null;
    this._roomName = '';

    this._mappingEnabled = false;  // Start with mapping disabled
    this._lastRoomDescription = ''; // Store the full room description to detect actual moves

    // Map tracking variables
    this._map = {
      rooms: {},
      // Stores all rooms with coordinates as keys
      currentPosition: '0,0,0',  // x,y,z coordinates (origin point)
      currentLevel: 0,
      // Current Z level for visualization
      history: []
      // Movement history
    };

    // Direction to coordinate delta mapping
    this._directionDeltas = {
      'north': [0, -1, 0],
      'n': [0, -1, 0],
      'east': [1, 0, 0],
      'e': [1, 0, 0],
      'south': [0, 1, 0],
      's': [0, 1, 0],
      'west': [-1, 0, 0],
      'w': [-1, 0, 0],
      'up': [0, 0, 1],
      'u': [0, 0, 1],
      'down': [0, 0, -1],
      'd': [0, 0, -1],
      'northeast': [1, -1, 0],
      'ne': [1, -1, 0],
      'northwest': [-1, -1, 0],
      'nw': [-1, -1, 0],
      'southeast': [1, 1, 0],
      'se': [1, 1, 0],
      'southwest': [-1, 1, 0],
      'sw': [-1, 1, 0]
    };
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
      console.log('Terminal execution started');
      const execution = executionStartEvent.execution;
      const stream = execution.read();

      // Save terminal reference
      if (executionStartEvent.terminal) {
        this._terminal = executionStartEvent.terminal;
        console.log('Terminal reference saved');
      }

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

  // Process MUD output functions
  /**
   * Extract the room name from MUD output data
   * @param {string} data - The raw data received from the terminal
   * @returns {string|null} - The room name or null if not found
   */
  _extractRoomName(data) {
    if (!data) return null;

    // First strip ANSI color codes
    const strippedData = data.replace(/\x1B\[([0-9]{1,2}(;[0-9]{1,2})?)?[m|K]/g, '');

    // Only process if we have both a mini-map and Obvious Exits
    if (strippedData.includes('Obvious Exits') && strippedData.includes('+-')) {
      // Find the mini-map marker start
      const mapStartIndex = strippedData.indexOf('+-');

      if (mapStartIndex > 0) {
        // Find the Obvious Exits line, which marks the end of room description
        const exitsLineIndex = strippedData.indexOf('Obvious Exits');

        if (exitsLineIndex > mapStartIndex) {
          // Get the line right before the mini-map starts - that's the room name
          const textBeforeMap = strippedData.substring(0, mapStartIndex).trim();

          const lines = textBeforeMap.split('\n');

          // Get the last non-empty line before the map starts that isn't a prompt
          let roomName = null;

          for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i].trim();

            if (line && !line.startsWith('<') && !line.includes('move')) {
              roomName = line;
              break;
            }
          }

          if (roomName) {
            // Now extract and store the essential room description (room name, map, exits)
            // Find the end of the Obvious Exits line (ends with a closing bracket)
            const exitsLineEnd = strippedData.indexOf(']', exitsLineIndex);

            if (exitsLineEnd > 0) {
              // Store from room name to end of Obvious Exits
              // First include the room name explicitly, then the map and exits
              const essentialDesc = roomName + '\n' + strippedData.substring(mapStartIndex, exitsLineEnd + 1);

              this._lastRoomDescription = essentialDesc.trim();

              console.log('Extracted room name:', roomName);

              return roomName;
            }
          }
        }
      }
    }

    return null;
  }

  _processMudOutput(data) {
    if (!data) return;

    // First strip ANSI color codes
    const strippedData = data.replace(/\x1B\[([0-9]{1,2}(;[0-9]{1,2})?)?[m|K]/g, '');

    // Extract room name
    const roomName = this._extractRoomName(data);

    if (roomName) {
      // Update map with room information
      this._updateMapWithRoom(roomName);
    }

    // Check for exits in the output
    const exitMatch = strippedData.match(/Obvious Exits:([\s?\(\w\)]+)/i);

    if (exitMatch) {
      this._exitCount++;

      const exitsText = exitMatch[1].trim();

      // Process exit directions, handling parentheses
      const exitParts = exitsText.split(/\s+/);

      this._exits = exitParts.map(part => {
        // Remove parentheses if present
        return part.replace(/[\(\)]/g, '');
      });

      console.log('Detected exits:', this._exits);

      // Update map with exits
      if (this._roomName) {
        this._updateMapWithExits(this._exits);
      }

      this._updateWebview();

      return true; // Indicates that exits were found
    }

    return false; // No exits found
  }

  /**
   * Generate a short name for room display by removing common articles
   * @param {string} roomName - The full room name
   * @returns {string} - A shortened room name suitable for display
   */
  _generateShortName(roomName) {
    if (!roomName) return '?';

    // Remove any text after a dash (common in area names)
    let shortName = roomName.split(' - ')[0];

    // Split into words
    const words = shortName.split(' ');

    // Remove common articles from the beginning
    if (['A', 'An', 'The'].includes(words[0])) {
      words.shift();
    }

    // If we have words left, use the first meaningful word
    if (words.length > 0) {
      return words[0];
    }

    // Fallback to the first letter of the original room name
    return roomName.charAt(0);
  }

  _updateMapWithRoom(roomName) {
    if (!roomName) return;

    // Always store the current room name, regardless of mapping state
    this._roomName = roomName;

    // If mapping is disabled, don't update the map
    if (!this._mappingEnabled) {
      return;
    }

    // Check if the last command was a movement direction
    const direction = this._lastCommand.toLowerCase().trim();

    if (this._directionDeltas[direction]) {
      // Calculate new position based on movement direction
      const [currentX, currentY, currentZ] = this._map.currentPosition.split(',').map(Number);

      const [dx, dy, dz] = this._directionDeltas[direction];

      const newPosition = `${currentX + dx},${currentY + dy},${currentZ + dz}`;

      console.log(`Moving from ${this._map.currentPosition} to ${newPosition} (${direction})`);

      // Add to movement history
      this._map.history.push({
        from: this._map.currentPosition,
        to: newPosition,
        direction: direction,
        roomName: roomName,
        timestamp: Date.now()
      });

      // Update current position
      this._map.currentPosition = newPosition;
    }

    // Create or update the room at the current position
    if (!this._map.rooms[this._map.currentPosition]) {
      // Calculate a shortened name for display
      const shortName = this._generateShortName(roomName);

      this._map.rooms[this._map.currentPosition] = {
        name: roomName,
        shortName: shortName,
        firstVisit: Date.now(),
        visits: 1,
        exits: {},
        coordinates: this._map.currentPosition.split(',').map(Number)
      };
    } else {
      // Update existing room
      this._map.rooms[this._map.currentPosition].visits++;

      this._map.rooms[this._map.currentPosition].lastVisit = Date.now();

      // Always update the room name if it was previously unknown
      if (this._map.rooms[this._map.currentPosition].name === '?') {
        this._map.rooms[this._map.currentPosition].name = roomName;
        this._map.rooms[this._map.currentPosition].shortName = this._generateShortName(roomName);
      }

      // Keep the existing exits
    }

    console.log(`Updated map with room: ${roomName} at ${this._map.currentPosition}`);
  }

  /**
   * Update the exits for the current room
   * @param {string[]} exits - Array of available exit directions
   */
  _updateMapWithExits(exits) {
    if (!exits || !exits.length || !this._mappingEnabled) return;

    // Get the current room
    const currentRoom = this._map.rooms[this._map.currentPosition];

    if (!currentRoom) return;

    // Update exits
    exits.forEach(exit => {
      const normalizedExit = exit.toLowerCase();

      if (this._directionDeltas[normalizedExit]) {
        // Calculate where this exit would lead
        const [currentX, currentY, currentZ] = this._map.currentPosition.split(',').map(Number);

        const [dx, dy, dz] = this._directionDeltas[normalizedExit];

        const targetPosition = `${currentX + dx},${currentY + dy},${currentZ + dz}`;

        // Add this exit to the room's exits
        currentRoom.exits[normalizedExit] = targetPosition;

        // If we haven't created the target room yet, create a placeholder
        if (!this._map.rooms[targetPosition]) {
          this._map.rooms[targetPosition] = {
            name: '?',
            visits: 0,  // Use visits for tracking if room has been visited
            exits: {},
            coordinates: [currentX + dx, currentY + dy, currentZ + dz]
          };

          // Add reverse exit if it makes sense
          const reverseDirection = this._getReverseDirection(normalizedExit);

          if (reverseDirection) {
            this._map.rooms[targetPosition].exits[reverseDirection] = this._map.currentPosition;
          }
        }
      }
    });

    console.log('Updated exits for room:', currentRoom.name, currentRoom.exits);
  }

  /**
   * Get the reverse direction for a given direction
   * @param {string} direction - The direction to reverse
   * @returns {string} - The opposite direction
   */
  _getReverseDirection(direction) {
    const reverseMap = {
      'north': 'south', 'n': 's',
      'south': 'north', 's': 'n',
      'east': 'west', 'e': 'w',
      'west': 'east', 'w': 'e',
      'up': 'down', 'u': 'd',
      'down': 'up', 'd': 'u',
      'northeast': 'southwest', 'ne': 'sw',
      'southwest': 'northeast', 'sw': 'ne',
      'northwest': 'southeast', 'nw': 'se',
      'southeast': 'northwest', 'se': 'nw'
    };

    return reverseMap[direction];
  }

  /**
   * Reset the map data
   */
  _resetMap() {
    this._map = {
      rooms: {},
      currentPosition: '0,0,0',
      currentLevel: 0,
      history: []
    };

    console.log('Map has been reset');
  }

  /**
   * Generate HTML for the map visualization
   * @returns {string} HTML string for the map
   */
  _generateMapHtml() {
    // If no rooms yet, show placeholder
    if (Object.keys(this._map.rooms).length === 0) {
      return '<div class="map-placeholder">Explore the MUD to build your map!</div>';
    }

    // Find map boundaries
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    for (const roomKey in this._map.rooms) {
      const [x, y] = roomKey.split(',').map(Number);

      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }

    // Add some padding
    minX -= 2;
    maxX += 2;
    minY -= 2;
    maxY += 2;

    // Calculate grid dimensions
    const gridWidth = maxX - minX + 1;
    const gridHeight = maxY - minY + 1;

    // Create the grid
    let html = `<div class="map-grid" style="grid-template-columns: repeat(${gridWidth}, 30px); grid-template-rows: repeat(${gridHeight}, 30px);">`;

    // Fill the grid with cells
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const pos = `${x},${y},0`; // Assuming Z=0 for now

        const room = this._map.rooms[pos];

        const isCurrentRoom = pos === this._map.currentPosition;

        // Cell content based on whether room exists
        if (room) {
          const roomClass = isCurrentRoom ? 'room current-room' : (room.visits > 0 ? 'room' : 'room unknown-room');

          // Use the shortName's first letter, or fallback to the first letter of the full name
          const roomInitial = (room.shortName ? room.shortName.charAt(0) : room.name.charAt(0)).toUpperCase();

          const roomTitle = room.name.replace(/'/g, '&apos;');

          html += `<div class="map-cell" title="${roomTitle}">`;

          // Add paths to neighboring rooms
          if (room.exits) {
            for (const [direction, targetPos] of Object.entries(room.exits)) {
              const shortDir = direction.charAt(0); // First letter of direction

              if (['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].includes(shortDir)) {
                html += `<div class="path-${shortDir}"></div>`;
              }
            }
          }

          html += `<div class="${roomClass}">${roomInitial}</div>`;
          html += `</div>`;
        } else {
          html += `<div class="map-cell"></div>`;
        }
      }
    }

    html += '</div>';

    return html;
  }

  _getHtmlForWebview(webview) {
    // Generate map HTML
    const mapHtml = this._generateMapHtml();

    // Create JSON representation for debugging
    const mapJson = JSON.stringify(this._map, null, 2);

    return `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          :root {
            --cell-size: 30px;
          }
          body {
            font-family: var(--vscode-font-family);
            padding: 10px;
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
          }
          h1, h2, h3 {
            color: var(--vscode-editor-foreground);
            margin-top: 10px;
            margin-bottom: 10px;
          }
          .container {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .exits-container {
            margin-top: 10px;
          }
          .exits {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
          }
          .exit-tag {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border-radius: 4px;
            padding: 4px 8px;
            cursor: pointer;
          }
          .exit-tag:hover {
            background-color: var(--vscode-button-hoverBackground);
          }
          .command-container {
            margin-top: 10px;
          }
          .command {
            padding: 5px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 4px;
            font-family: monospace;
          }
          /* Map styling */
          .map-container {
            margin-top: 20px;
          }
          .map-grid {
            display: grid;
            border: 1px solid var(--vscode-panel-border);
            margin: 10px 0;
            background-color: var(--vscode-editor-background);
            overflow: auto;
          }
          .map-cell {
            width: var(--cell-size);
            height: var(--cell-size);
            position: relative;
            box-sizing: border-box;
            border: 1px dotted rgba(255, 255, 255, 0.1);
          }
          .map-placeholder {
            padding: 20px;
            text-align: center;
            font-style: italic;
            color: var(--vscode-disabledForeground);
          }
          .room {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: calc(var(--cell-size) * 0.7);
            height: calc(var(--cell-size) * 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border-radius: 50%;
            font-weight: bold;
            font-size: calc(var(--cell-size) * 0.35);
            z-index: 2;
          }
          .current-room {
            background-color: #5cb85c; /* Green color for better visibility */
            color: white;
            border: 2px solid white;
          }
          .unknown-room {
            background-color: var(--vscode-disabledForeground);
            color: white;
          }
          .path-n, .path-s, .path-e, .path-w,
          .path-ne, .path-nw, .path-se, .path-sw {
            position: absolute;
            background-color: var(--vscode-panelTitle-activeForeground);
            z-index: 1;
          }
          .path-n, .path-s {
            width: 3px;
            height: calc(var(--cell-size) * 0.5);
            left: 50%;
            transform: translateX(-50%);
          }
          .path-n { top: 0; }
          .path-s { bottom: 0; }
          .path-e, .path-w {
            height: 3px;
            width: calc(var(--cell-size) * 0.5);
            top: 50%;
            transform: translateY(-50%);
          }
          .path-e { right: 0; }
          .path-w { left: 0; }
          .map-controls {
            display: flex;
            justify-content: center;
            margin: 10px 0;
            gap: 5px;
          }
          .map-control-btn {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            padding: 4px 8px;
            cursor: pointer;
          }
          .map-control-btn:hover {
            background-color: var(--vscode-button-hoverBackground);
          }
          .map-control-btn.active {
            background-color: var(--vscode-statusBarItem-warningBackground);
          }
          .map-json, .room-desc-text {
            width: 100%;
            height: 150px;
            font-family: monospace;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-panel-border);
            resize: vertical;
            padding: 5px;
          }
          .map-debug {
            margin-top: 10px;
          }
          .debug-section {
            margin-top: 30px;
            border-top: 2px solid var(--vscode-panel-border);
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>MUD Assistant</h1>
          ${this._exits.length > 0 ? `
          <div class="exits-container">
            <h3>Available Exits:</h3>
            <div class="exits">
              ${this._exits.map(exit => `<span class="exit-tag" onclick="sendCommand('${exit}')">${exit}</span>`).join('')}
            </div>
          </div>
          ` : ''}
          <!-- Map section -->
          <div class="map-container">
            <h2>Map</h2>
            <div class="map-controls">
              <button class="map-control-btn ${this._mappingEnabled ? 'active' : ''}" onclick="toggleMapping()">${this._mappingEnabled ? 'Pause Mapping' : 'Start Mapping'}</button>
              <button class="map-control-btn" onclick="resetMap()">Reset Map</button>
              <button class="map-control-btn" onclick="zoomIn()">Zoom In</button>
              <button class="map-control-btn" onclick="zoomOut()">Zoom Out</button>
            </div>
            <div id="map-area">
              ${mapHtml}
            </div>
          </div>
          <p>Connect to your MUD in the terminal below.</p>
          <!-- Debug Section with visual separator -->
          <div class="debug-section">
            <h2>Debugging Information</h2>
            <!-- Last Command (always visible) -->
            <div class="command-container">
              <h3>Last Command:</h3>
              <div class="command">${this._lastCommand || 'No command yet'}</div>
            </div>
            <!-- Current Room Name -->
            <div class="room-name-container">
              <h3>Current Room Name:</h3>
              <div class="command">${this._roomName || 'Unknown room'}</div>
            </div>
            <!-- Last Room Description -->
            <div class="room-desc-container">
              <h3>Last Room Description:</h3>
              <textarea class="room-desc-text" readonly>${this._lastRoomDescription || 'No room description yet'}</textarea>
            </div>
            <!-- Map Data -->
            <div class="map-debug">
              <h3>Map Data:</h3>
              <textarea class="map-json" readonly>${mapJson}</textarea>
            </div>
          </div>
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
          
          // Map control functions
          function toggleMapping() {
            vscode.postMessage({
              command: 'mapControl',
              action: 'toggleMapping'
            });
          }
          
          function resetMap() {
            vscode.postMessage({
              command: 'mapControl',
              action: 'reset'
            });
          }
          
          function zoomIn() {
            const mapArea = document.getElementById('map-area');
            const mapGrid = mapArea.querySelector('.map-grid');
            if (mapGrid) {
              const currentSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--cell-size') || '30');
              document.documentElement.style.setProperty('--cell-size', (currentSize + 5) + 'px');
            }
          }
          
          function zoomOut() {
            const mapArea = document.getElementById('map-area');
            const mapGrid = mapArea.querySelector('.map-grid');
            if (mapGrid) {
              const currentSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--cell-size') || '30');
              if (currentSize > 15) {
                document.documentElement.style.setProperty('--cell-size', (currentSize - 5) + 'px');
              }
            }
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
function deactivate() { }
module.exports = {
  activate,
  deactivate
};
