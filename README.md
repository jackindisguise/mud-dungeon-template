# MUD Dungeon System

A sophisticated 3D space management system for text-based games, providing room-based environments with object containment, keyword identification, and flexible movement mechanics. Particularly suited for MUD (Multi-User Dungeon) style games.

## Core Features

### Directional Movement
The system uses a bitwise flag system for directions, enabling both simple and composite movements:

```typescript
// Cardinal directions
DIRECTION.NORTH
DIRECTION.SOUTH
DIRECTION.EAST
DIRECTION.WEST

// Vertical movement
DIRECTION.UP
DIRECTION.DOWN

// Diagonal movement (predefined)
DIRECTION.NORTHEAST
DIRECTION.NORTHWEST
DIRECTION.SOUTHEAST
DIRECTION.SOUTHWEST

// Create diagonal directions manually (same result)
const diagonal = DIRECTION.NORTH | DIRECTION.EAST; // Same as DIRECTION.NORTHEAST
```

Direction utilities include:
- Text representation (`DIR2TEXT`)
- Opposite direction mapping (`DIR2REVERSE`)
- Direction reversal function (`reverseDirection`)

### Space Management

#### Dungeon
Central management class for the 3D game world:

```typescript
// Create a three-level dungeon
const dungeon = new Dungeon({
    dimensions: {
        width: 10,   // East-West
        height: 10,  // North-South
        layers: 3    // Up-Down
    }
});

// Find rooms
const groundFloor = dungeon.getRoom({ x: 0, y: 0, z: 0 });
const secondFloor = dungeon.getRoom({ x: 0, y: 0, z: 1 });

// Calculate adjacent rooms
const nextRoom = dungeon.getStep({ x: 0, y: 0, z: 0 }, DIRECTION.NORTH);
```

Features:
- Automatic room generation
- Global object tracking
- Room navigation and lookup
- Multi-layer support
- Boundary enforcement

#### Room
Represents individual locations within the dungeon:

```typescript
// Get room from dungeon
const room = dungeon.getRoom({ x: 1, y: 1, z: 0 });

// Check adjacent rooms
const northRoom = room.getStep(DIRECTION.NORTH);
const diagonalRoom = room.getStep(DIRECTION.NORTHEAST);

// Custom movement rules
class LockedRoom extends Room {
    canEnter(movable: Movable, direction?: DIRECTION) {
        return movable.contents.some(item => item.match("key"));
    }

    onEnter(movable: Movable, direction?: DIRECTION) {
        console.log("The door clicks shut behind you...");
    }
}
```

Features:
- Three-dimensional positioning
- Adjacent room navigation
- Movement validation hooks
- Entry/exit event handlers
- Customizable behavior

### Objects
`DungeonObject` is the base class for all interactive elements:

```typescript
// Create items with keyword matching
const sword = new DungeonObject({
    keywords: "sword blade weapon",  // Space-delimited keywords
	display: "a short sword"
});

const sheath = new DungeonObject({
    keywords: "leather sheath scabbard",  // Simple word list
	display: "a leather sheath"
});

// Nested containments
sheath.addObject(sword);

// Find objects using natural language
const weapon = sword.match("blad");  // Matches individual, partial words
const container = sheath.match("leather sheath");     // Matches multiple keyword

// Container queries
const isInSheath = sheath.contains(sword);
const parentContainer = sword.location;
```

Features:
- Simple space-delimited keywords
- Natural language matching
- Nested object containment
- Direct/indirect containment queries
- Custom matching logic

### Movement
`Movable` extends `DungeonObject` with navigation abilities:

Features:
- Room-to-room navigation
- Movement validation hooks
- Event handling system
- Location tracking
- Custom movement rules

## Installation
Don't install this. It's meant to be imported and/or read.

```bash
npm install jackindisguise/mud-dungeon-template
```

Dependencies:
- [mud-ext](https://github.com/jackindisguise/mud-ext) - String matching utilities
- TypeScript 5.5.0+ for development

## Development

```bash
# Install dev dependencies
npm install

# Run tests
npm test

# Build TypeScript
npm run build

# Generate documentation
npm run doc
```

## License