const vscode = require('vscode');

/**
 * Handles terminal interaction for the MUD client.
 */
class MUDTerminal {
  /**
   * Creates a new instance of the MUDTerminal.
   *
   * @param {MUDState} state - The central state manager.
   */
  constructor(state, manager) {
    this.state = state
    this.manager = manager
    this.executionTerminal = null
    this.executionStream = null
    this.pendingLastCommand = ""

    this.initTerminalWatcher()
  }

  /**
   * Disposes of resources used by the terminal.
   */
  dispose() {
    this.executionTerminal.dispose()
    this.executionStream.dispose()
  }

  /**
   * Sets up the terminal watcher to monitor terminal output.
   * @private
   */
  initTerminalWatcher() {
    const disposable = vscode.window.onDidStartTerminalShellExecution(async executionStartEvent => {
      console.log(' *** Terminal execution started')
      this.executionStream = executionStartEvent.execution.read()

      if (executionStartEvent.terminal) {
        this.executionTerminal = executionStartEvent.terminal
      }

      try {
        if (this.executionStream && typeof this.executionStream[Symbol.asyncIterator] === 'function') {
          for await (const data of this.executionStream) {
            const cleanedData = this.cleanMudOutput(data)

            // If we have good / clean data, send it back to the manager
            if (cleanedData && cleanedData.length) {
              this.trackUserCommand(cleanedData)
              this.manager.onTerminalData(cleanedData)
            }
          }
        } else {
          console.log('Reader is not an async iterator')
        }
      } catch (err) {
        console.error('Error reading terminal stream:', err)
      }
    });

    this.manager.addDisposable(disposable, "Terminal Execution Watcher")
  }

  /**
   * Clean MUD output to extract room information.
   *
   * @param {string} data - The MUD output data to process.
   */
  cleanMudOutput(data) {
    if (!data) return ""

    // Strip ANSI color codes
    const cleanedData = data.replace(/\x1B\[([0-9]{1,2}(;[0-9]{1,2})?)?[m|K]/g, '')

    return cleanedData
  }

  /**
   * Sends a command to the terminal.
   *
   * @param {string} command - The command to send.
   * @returns {boolean} True if the command was sent, false otherwise.
   */
  sendCommand(command) {
    if (!command) return false;

    const trimmedCommand = command.trim();

    // Update state with the command
    this.state.lastCommand = trimmedCommand

    if (this.executionTerminal) {
      this.executionTerminal.sendText(trimmedCommand + '\n');
      console.log('Sent command to terminal:', trimmedCommand);
      return true;
    }

    console.log('No terminal available to send command');
    return false;
  }

  /**
   * Tracks user commands by analyzing incoming data.
   *
   * @param {string} cleanedData - The cleaned data received from the terminal.
   * @returns {string|null} The completed command if one was entered, otherwise null.
   */
  trackUserCommand(cleanedData) {
    // Check for a backspace and remove a character from our pending command
    if (cleanedData == '\x1b[1D\x1b[1X') {
      this.pendingLastCommand = this.pendingLastCommand.substring(0, this.pendingLastCommand.length - 1)
    }

    // Assume that any message from the terminal with less than 5 characters is
    // a command that the user is in the process of typing
    else if (cleanedData.length < 5) {
      // If we see a newline, save the command as the lastCommand
      if (cleanedData.includes('\n') || cleanedData.includes('\r')) {
        const command = this.pendingLastCommand;

        this.state.lastCommand = command;
        this.pendingLastCommand = '';

        return command;
      }

      // Otherwise, keep adding to the pending command
      else {
        this.pendingLastCommand += cleanedData;
      }
    }

    return null;
  }
}

module.exports = MUDTerminal;
