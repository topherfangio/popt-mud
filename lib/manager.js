const vscode = require('vscode')

const MUDState = require('./state')
const MUDMapper = require('./mapper')
const MUDTerminal = require('./terminal')
const MUDRenderer = require('./render')
const MUDRoomParser = require('./room-parser')

/**
 * Manages the MUD session and coordinates component interactions.
 */
class MUDManager {
  /**
   * Creates a new instance of the MUDManager.
   *
   * @param {vscode.ExtensionContext} context - The extension context.
   */
  constructor(context) {
    // Store in any passed references (we won't dispose of these)
    this.context = context

    // Make sure we track all of the objects we need to dispose
    this.disposables = []

    // Setup all of our components
    this.state = new MUDState()
    this.roomParser = new MUDRoomParser()

    this.mapper = new MUDMapper(this.state)
    this.terminal = new MUDTerminal(this.state, this)
    this.renderer = new MUDRenderer(this.context, this.state, this)

    this.disposables.push({ object: this.mapper, description: "MUD Mapper" })
    this.disposables.push({ object: this.roomParser, description: "MUD Room Parser" })
    this.disposables.push({ object: this.terminal, description: "MUD Terminal" })
    this.disposables.push({ object: this.renderer, description: "MUD Renderer" })
    this.disposables.push({ object: this.state, description: "MUD State" })
  }

  onTerminalData(cleanedData) {
    console.log(' *** onTerminalData', cleanedData)
    const roomInfo = this.roomParser.extractRoomInfo(cleanedData)

    if (roomInfo) {
      this.mapper.onEnterRoom(roomInfo)
    }

    this.tick()
  }

  onRendererCommand(message) {
    const worker = this[message.command]

    if (worker) {
      worker.sendAction(message.action)
    } else {
      vscode.window.showErrorMessage(`Unknown command: ${message.command}`)
    }

    this.tick()
  }

  tick() {
    this.renderer.update()
  }

  addDisposable(disposable, description) {
    this.disposables.push({ object: disposable, description: description })
  }

  /**
   * Disposes of resources used by the manager.
   */
  dispose() {
    console.log('Disposing MUD Manager')

    this.state.disposing = true

    // Dispose all disposables
    this.disposables.forEach(disposable => {
      try {
        disposable.object.dispose()
      } catch (e) {
        console.error(`Error disposing ${disposable.description}:`, e)
      }
    });

    // Clear the array
    this.disposables = []

    // Reset the state
    this.state.reset()
  }
}

module.exports = MUDManager;
