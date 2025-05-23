const vscode = require('vscode');

/**
 * Handles MUD map and room tracking.
 */
class MUDMapper {
  /**
   * Creates a new instance of the MUDMapper.
   *
   * @param {MUDState} state - The central state manager.
   */
  constructor(state) {
    this.state = state;
    this.state.rooms = new Map()

    this.reset()
  }

  /**
   * Updates the current room with new information.
   *
   * @param {Object} roomInfo - Information about the room.
   */
  onEnterRoom(roomInfo) {
    // Remember the last room we were in
    if (this.state.currentRoomId) {
      this.state.previousRoomId = this.state.currentRoomId;
    }

    // Remember the current room ID
    this.state.currentRoomId = roomInfo.id;

    // If mapping is enabled, set rooms we haven't seen before
    if (this.state.mappingEnabled && !this.state.rooms.has(roomInfo.id)) {
      this.state.rooms.set(roomInfo.id, { ...roomInfo });
    }
  }

  /**
   * Toggles mapping on or off.
   */
  sendAction(action) {
    switch (action) {
      case 'toggleMapping':
        this.state.mappingEnabled = !this.state.mappingEnabled
        vscode.window.showInformationMessage("Mapping Toggled")
        break;
      case 'reset':
        this.reset()
        vscode.window.showInformationMessage("Map Reset")
        break;
    }
  }

  /**
   * Resets the mapper.
   */
  reset() {
    this.state.mappingEnabled = false;
    this.state.previousRoomId = null;
    this.state.currentRoomId = null;

    this.state.rooms.clear();
  }

  /**
   * Disposes of resources used by the mapper.
   */
  dispose() {
    this.reset()
  }
}

module.exports = MUDMapper;
