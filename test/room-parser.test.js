/**
 * Tests for the room-parser module
 *
 * These tests verify that the room parser correctly extracts room information
 * from MUD output examples defined in XML files.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const roomParser = require('../lib/room-parser');

describe('Room Parser', function() {
  let examples = [];

  // Load test data once before all tests
  before(async function() {
    // Load the XML file with examples
    const xmlPath = path.join(__dirname, '..', 'tintin', 'tests', 'room_checks.xml');
    const xmlContent = fs.readFileSync(xmlPath, 'utf8');

    // Parse XML file
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(xmlContent);

    // Make sure we have examples to test
    assert(result.examples, 'No examples found in XML file');

    // Handle both single and multiple examples
    examples = Array.isArray(result.examples.example)
      ? result.examples.example
      : [result.examples.example];
  });

  describe('generateShortName', function() {
    it('should generate correct short names', function() {
      const testCases = [
        { input: 'The Dark Forest', expected: 'Dark Forest' },
        { input: 'A Quiet Room', expected: 'Quiet Room' },
        { input: 'An Ancient Temple', expected: 'Ancient Temple' },
        { input: 'No Article Here', expected: 'No Article Here' }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = roomParser.generateShortName(input);
        assert.strictEqual(result, expected,
          `Expected "${expected}" for "${input}", but got "${result}"`);
      });
    });
  });

  describe('generateRoomId', function() {
    it('should generate consistent room IDs for the same input', function() {
      const room1 = {
        name: 'Test Room',
        minimap: ['   o   ', '   |   ', ' o-X-o '],
        description: 'This is a test room',
        exits: ['north', 'east', 'west']
      };

      const id1 = roomParser.generateRoomId(room1);
      const id2 = roomParser.generateRoomId(room1);

      assert.strictEqual(id1, id2, 'Same room should generate the same ID');
    });

    it('should generate different IDs for different rooms', function() {
      const room1 = {
        name: 'Test Room 1',
        minimap: ['   o   ', '   |   ', ' o-X-o '],
        description: 'This is test room 1',
        exits: ['north', 'east', 'west']
      };

      const room2 = {
        name: 'Test Room 2',
        minimap: ['   o   ', '   |   ', ' o-X-o '],
        description: 'This is test room 2',
        exits: ['north', 'east']
      };

      const id1 = roomParser.generateRoomId(room1);
      const id2 = roomParser.generateRoomId(room2);

      assert.notStrictEqual(id1, id2, 'Different rooms should have different IDs');
    });
  });

  describe('extractRoomInfo', function() {
    it('should extract complete room information', function() {
      examples.forEach((example, index) => {
        const inputText = example.input;
        const expectedOutput = JSON.parse(example.output);

        const roomInfo = roomParser.extractRoomInfo(inputText);

        // Verify room info structure
        assert(roomInfo, `Failed to extract room info from example ${index}`);
        assert.strictEqual(typeof roomInfo, 'object', 'Room info should be an object');

        // Verify required fields
        assert('name' in roomInfo, `Missing name in example ${index}`);
        assert('shortName' in roomInfo, `Missing shortName in example ${index}`);
        assert('percent' in roomInfo, `Missing percent in example ${index}`);
        assert('minimap' in roomInfo, `Missing minimap in example ${index}`);
        assert('description' in roomInfo, `Missing description in example ${index}`);
        assert('exits' in roomInfo, `Missing exits in example ${index}`);
        assert('id' in roomInfo, `Missing id in example ${index}`);

        // Verify types
        assert.strictEqual(typeof roomInfo.name, 'string', 'name should be a string');
        assert.strictEqual(typeof roomInfo.shortName, 'string', 'shortName should be a string');
        assert.strictEqual(typeof roomInfo.percent, 'string', 'percent should be a string');
        assert(Array.isArray(roomInfo.minimap), 'minimap should be an array');
        assert.strictEqual(typeof roomInfo.description, 'string', 'description should be a string');
        assert(Array.isArray(roomInfo.exits), 'exits should be an array');
        assert.strictEqual(typeof roomInfo.id, 'string', 'id should be a string');

        // Verify field equality
        assert.strictEqual(roomInfo.name, expectedOutput.name, 'name should match');
        assert.strictEqual(roomInfo.shortName, expectedOutput.shortName, 'shortName should match');
        assert.strictEqual(roomInfo.percent, expectedOutput.percent, 'percent should match');
        assert.deepStrictEqual(roomInfo.minimap, expectedOutput.minimap, 'minimap should match');
        assert.strictEqual(roomInfo.description, expectedOutput.description, 'description should match');
        assert.deepStrictEqual(roomInfo.exits, expectedOutput.exits, 'exits should match');
        assert.strictEqual(roomInfo.id, expectedOutput.id, 'id should match');

        // Log success for each example
        console.log(`      ✓ Example ${index} passed: ${roomInfo.name}`);
      });
    });
  });
});
