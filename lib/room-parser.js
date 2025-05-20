/**
 * Room Parser - Extracts room information from MUD output
 *
 * This module provides functions to extract room details from MUD output text
 * including room name, description, map, exits, and a unique room ID.
 */

const hash = require('object-hash');

/**
 * Extract the room name from the MUD output
 *
 * @param {string} data - The raw data received from the terminal
 *
 * @returns {string} - The extracted room name or empty string if not found
 */
function extractName(data) {
  if (!data) return '';

  const lines = data.split('\n');
  const mapStartLine = lines.findIndex(line => line.startsWith('+-'));

  if (mapStartLine <= 0) return '';

  // Look for the room name above the map
  for (let i = mapStartLine - 1; i >= 0; i--) {
    const line = lines[i].trim();

    // Check for a prompt line and extract it out of there
    if (line && line.startsWith('<')) {
      return line.match(/<.*> (.*)$/)[1];
    }

    // Otherwise, it should be a blank line with just the room name
    else if (line && !line.match(/^\s*\d+/)) {
      return line;
    }
  }

  return '';
}

/**
 * Extract a short name from the full room name
 *
 * @param {string} name - The full room name
 *
 * @returns {string} - The shortened room name
 */
function extractShortName(name) {
  if (!name) return '?';

  // Remove any text after a dash (common in area names)
  let shortName = name.split(' - ')[0].trim();

  // Remove common articles from the beginning
  const articles = ['a ', 'an ', 'the '];
  for (const article of articles) {
    if (shortName.toLowerCase().startsWith(article)) {
      return shortName.substring(article.length).trim();
    }
  }

  return shortName;
}

/**
 * Extract the percentage from the MUD output
 *
 * @param {string} data - The raw data received from the terminal
 *
 * @returns {string} - The extracted percentage or empty string if not found
 */
function extractPercent(data) {
  if (!data) return '';

  const percentMatch = data.match(/\[\s*(\d+%)\s*\]/);
  return percentMatch ? percentMatch[1] : '';
}

/**
 * Extract the minimap from the MUD output
 *
 * @param {string} data - The raw data received from the terminal
 *
 * @returns {string[]} - Array of strings representing the minimap
 */
function extractMinimap(data) {
  if (!data) return [];

  const lines = data.split('\n');
  const mapStartLine = lines.findIndex(line => line.includes('+-'));

  if (mapStartLine === -1) return [];

  const minimap = [];
  let i = mapStartLine;

  // Find the end of the map (empty line or end of data)
  while (i < lines.length && lines[i].trim() !== '') {
    const line = lines[i];

    // Only include lines that are part of the map (start with a | character)
    if (line.match(/^\|/)) {
      // Only grab the contents between the |...| characters
      const minimatch = line.match(/\|(.*)\|/);

      minimap.push(minimatch[1]);
    } else if (minimap.length > 0) {
      // If we've started collecting map lines and hit a non-map line, we're done
      break;
    }

    i++;
  }

  return minimap;
}

/**
 * Extract the room description from the MUD output
 *
 * @param {string} data - The raw data received from the terminal
 * @param {string} roomName - The name of the room
 *
 * @returns {string} - The extracted description
 */
function extractDescription(data, roomName) {
  if (!data || !roomName) return '';

  const lines = data.split('\n');
  const mapStartLine = lines.findIndex(line => line.includes('+-'));
  const exitsLine = lines.findIndex(line => line.includes('Obvious Exits:'));

  if (mapStartLine === -1 || exitsLine === -1 || mapStartLine >= exitsLine) {
    return '';
  }

  const descLines = [];

  // Description starts at the first map line we find
  let descriptionLine = mapStartLine;

  while (descriptionLine < exitsLine) {
    const line = lines[descriptionLine].trim();

    // Skip empty lines and lines that are part of the map
    if (line) {
      const endOfLine = line.match(/^[\|\+](.*)?[\|\+](.*)$/);

      if (endOfLine) {
        descLines.push(endOfLine[2].trim());
      }
    }

    descriptionLine++;
  }

  return descLines.join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * Extract the exits from the MUD output
 *
 * @param {string} data - The raw data received from the terminal
 *
 * @returns {string[]} - Array of exit directions
 */
function extractExits(data) {
  if (!data) return [];

  const exitsLine = data.match(/\[Obvious Exits:( ?\(?\w\)?)+]/);
  const exits = exitsLine[0].substring(16, exitsLine[0].length - 1)

  return exits.split(" ");
}

/**
 * Extract room information from MUD output data
 *
 * @param {string} data - The raw data received from the terminal
 *
 * @returns {Object|null} - Room information object or null if not found
 */
function extractRoomInfo(data) {
  if (!data) return null;

  // Strip ANSI color codes
  const strippedData = data.replace(/\x1B\[([0-9]{1,2}(;[0-9]{1,2})?)?[m|K]/g, '');

  // Check if this is a room with a map and exits
  if (!strippedData.includes('Obvious Exits') || !strippedData.includes('+-')) {
    return null;
  }

  // Extract room information using the helper functions
  const name = extractName(strippedData);
  if (!name) return null;

  const roomInfo = {
    name: name,
    shortName: extractShortName(name),
    percent: extractPercent(strippedData),
    minimap: extractMinimap(strippedData),
    description: extractDescription(strippedData, name),
    exits: extractExits(strippedData)
  };

  // Generate a unique ID for the room
  roomInfo.id = generateRoomId(roomInfo);

  return roomInfo;
}

/**
 * Generate a unique room ID based on room name, map, description, and exits
 *
 * @param {Object} roomInfo - The room information object
 *
 * @returns {string} - A unique hash ID for the room
 */
function generateRoomId(roomInfo) {
  const hashableData = {
    name: roomInfo.name,
    minimap: roomInfo.minimap,
    description: roomInfo.description,
    exits: roomInfo.exits
  };

  return hash(hashableData);
}

/**
 * Generate a short name for room display by removing common articles
 *
 * @param {string} roomName - The full room name
 *
 * @returns {string} - A shortened room name suitable for display
 */
function generateShortName(roomName) {
  if (!roomName) return '?';

  // Remove any text after a dash (common in area names)
  let shortName = roomName.split(' - ')[0].trim();

  // Remove common articles from the beginning
  const articles = ['a ', 'an ', 'the '];
  for (const article of articles) {
    if (shortName.toLowerCase().startsWith(article)) {
      return shortName.substring(article.length).trim();
    }
  }

  return shortName;
}

module.exports = {
  extractRoomInfo,
  generateRoomId,
  generateShortName
};
