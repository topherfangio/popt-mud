/**
 * MUD State Manager
 * Centralized state management for the MUD extension.
 */
class MUDState {
  constructor() {
    // Define default state values
    this.reset()
  }

  /**
   * Resets the state back to its default values.
   */
  reset() {
    this.mappingEnabled = false
    this.lastCommand = ''
    this.rooms = new Map()
    this.previousRoomId = null
    this.currentRoomId = null
  }

  /**
   * Custom serialization method for JSON.stringify
   * Converts Map objects to a format that can be properly serialized
   *
   * @returns {Object} - A plain object representation of the state
   */
  toJSON() {
    // Create a plain object copy of this state object
    const serialized = { ...this }

    // Convert the rooms Map to an object of [key, value] pairs
    // This format preserves both keys and values and can be reconstructed
    serialized.rooms = Object.fromEntries(this.rooms.entries())

    return serialized
  }
}

// Export the class rather than an instance
module.exports = MUDState;
