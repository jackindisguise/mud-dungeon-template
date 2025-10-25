[![Static Badge](https://img.shields.io/badge/documentation-orange)](https://jackindisguise.github.io/mud-dungeon-template/)

# MUD Dungeon System

A 3D room/grid system for text-based games (MUDs). It provides room objects, containment hierarchies, movement primitives, an extensible linking system for non-Euclidean portals, and a persistent dungeon registry for serialization and cross-dungeon references.

## Directional movement

- `DIRECTION` — enum of cardinal, vertical and composite directions
- `dir2text(dir)` — convert a DIRECTION to human-readable text
- `dir2reverse(dir)` — returns the opposite direction

### Examples

```ts
enum DIRECTION {
	NORTH,
	SOUTH,
	EAST,
	WEST,
	UP,
	DOWN,
	NORTHEAST,
	NORTHWEST,
	SOUTHEAST,
	SOUTHWEST,
}

console.log(dir2text(DIRECTION.NORTH)); // "north"
console.log(dir2reverse(DIRECTION.NORTH)); // DIRECTION.SOUTH
```

## Dungeon and Rooms

Use `Dungeon` to create a 3D grid of rooms. Rooms are addressed by `{x, y, z}` coordinates.

```ts
const dungeon = Dungeon.generateEmptyDungeon({ 
	id: "castle",
	dimensions: { width: 10, height: 10, layers: 3 } 
});

const room = dungeon.getRoom({ x: 0, y: 0, z: 0 });
const northRoom = room.getStep(DIRECTION.NORTH);
```

Rooms are `DungeonObject`s and support containment, naming (keywords/display/description), and movement hooks:

- `canEnter(movable, direction?)` — override to restrict entry
- `canExit(movable, direction?)` — override to restrict exiting
- `onEnter(movable, direction?)` / `onExit(movable, direction?)` — event hooks

## Dungeon Registry

Dungeons with an `id` are automatically registered in `DUNGEON_REGISTRY` for global lookup. This enables serialization, persistent references, and cross-dungeon navigation.

```ts
// Create a dungeon with an ID
const dungeon = new Dungeon({
	id: "midgar",
	dimensions: { width: 10, height: 10, layers: 3 }
});

// Look it up from anywhere
const found = getDungeonById("midgar");
console.log(found === dungeon); // true
```

## Room References

The `getRoomByRef()` function provides a convenient way to look up rooms across all registered dungeons using a string-based reference format.

### Format

Room references use the pattern: `@dungeon-id{x,y,z}`

- `@` — Required prefix indicating a room reference
- `dungeon-id` — The ID of the dungeon (must be registered)
- `{x,y,z}` — The room coordinates enclosed in braces

### Examples

```ts
// Create a registered dungeon
const dungeon = Dungeon.generateEmptyDungeon({
	id: "midgar",
	dimensions: { width: 10, height: 10, layers: 3 }
});

// Look up a specific room using a reference string
const room = getRoomByRef("@midgar{5,3,1}");
if (room) {
	console.log(`Found room at ${room.x},${room.y},${room.z}`);
}
```

### Use Cases

Room references are particularly useful for:

- **Configuration files**: Define spawn points, quest locations, or teleport destinations
  ```json
  {
    "spawnPoint": "@town{5,5,0}",
    "questLocations": ["@dungeon{3,7,2}", "@forest{10,15,0}"]
  }
  ```

- **Teleport commands**: Allow players or admins to jump to specific locations
  ```ts
  function teleport(player: Movable, roomRef: string) {
    const destination = getRoomByRef(roomRef);
    if (destination) {
      destination.add(player);
    }
  }
  ```

- **Serialization**: Save and restore object locations across game sessions
  ```ts
  // Save
  const savedLocation = `@${room.dungeon?.id}{${room.x},${room.y},${room.z}}`;
  
  // Load
  const room = getRoomByRef(savedLocation);
  if (room) player.move(room);
  ```

- **Room links**: Create portals to specific destinations defined in data files
  ```ts
  const exitRoom = dungeon.getRoom({ x: 9, y: 9, z: 0 });
  const destination = getRoomByRef("@nextArea{0,0,0}");
  if (destination) {
    RoomLink.createTunnel(exitRoom, DIRECTION.EAST, destination);
  }
  ```

## Objects and Movables

`DungeonObject` is the base for items and containers. `Movable` extends it with movement helpers and coordinate caching.

### Examples

```ts
const sword = new DungeonObject({ keywords: "sword blade", display: "a sword" });
const player = new Movable();
player.add(sword); // sword added to player's inventory
room.add(player); // player added to room
if (player.canStep(DIRECTION.NORTH)) player.step(DIRECTION.NORTH);
```

## Location <-> Contents

A `DungeonObject`'s location is always another `DungeonObject` or `undefined`. When it is another `DungeonObject`, there is a reciprocal relationship between `DungeonObject` `A` (the container) and `DungeonObject` `B` (the contained object). `A` must always have `B` in its `contents`, and `B` must always have its location set to `A`. If either relationship changes, the other must change accordingly.

```ts
const A = new DungeonObject();
const B = new DungeonObject();

// changing location
B.location = A;
assert(A.contains(B)); // must be true
assert(B.location === A); // must be true

// adding to contents
const C = new DungeonObject();
C.add(B);
assert(C.contains(B)); // must be true
assert(B.location === C); // must be true
assert(A.contains(B) === false); // must be false

// using move()
B.move(A);
assert(A.contains(B)); // must be true
assert(B.location === A); // must be true
assert(C.contains(B) === false); // must be false
```

### Dungeon Tracking

When an object is placed in a room (or any container within a dungeon hierarchy), it and all its contents are automatically tracked by the dungeon:

```ts
const chest = new DungeonObject({ keywords: "chest" });
const coin = new DungeonObject({ keywords: "coin" });
chest.add(coin);

const room = dungeon.getRoom({ x: 0, y: 0, z: 0 });
room.add(chest);

// Both chest and coin are now tracked by the dungeon
assert(dungeon.contains(chest)); // true
assert(dungeon.contains(coin)); // true

// Get all objects in the dungeon (rooms + objects)
const allObjects = dungeon.contents;
```

When moving objects between dungeons, all nested contents update their dungeon references automatically.

## Room links (portals/tunnels)

Create non-Euclidean room links with support for both two-way tunnels and one-way portals.

- `RoomLink.createTunnel(fromRoom, direction, toRoom, oneWay = false)`
  - Creates and registers a link between two rooms
  - `direction` is the direction on `fromRoom` that leads to `toRoom`
  - If `oneWay` is true, the link only works from `fromRoom` -> `toRoom` (no return path)
  - Otherwise, creates a bidirectional tunnel with automatic reverse direction

### Examples

#### Two-way link (tunnel)

```ts
// Moving NORTH from roomA takes you to roomB
// Moving SOUTH from roomB returns you to roomA
const link = RoomLink.createTunnel(roomA, DIRECTION.NORTH, roomB);

assert(roomA.getStep(DIRECTION.NORTH) === roomB);
assert(roomB.getStep(DIRECTION.SOUTH) === roomA);
```

#### One-way link (portal)

```ts
// Moving EAST from roomA goes to roomB
// But moving WEST from roomB does NOT return to roomA
const oneWay = RoomLink.createTunnel(roomA, DIRECTION.EAST, roomB, true);

assert(roomA.getStep(DIRECTION.EAST) === roomB);
assert.notStrictEqual(roomB.getStep(DIRECTION.WEST), roomA);
```

#### Cross-dungeon links

```ts
// Links work between rooms in different dungeons
const dungeonA = Dungeon.generateEmptyDungeon({ 
	id: "overworld",
	dimensions: { width: 10, height: 10, layers: 1 } 
});
const dungeonB = Dungeon.generateEmptyDungeon({ 
	id: "underworld",
	dimensions: { width: 5, height: 5, layers: 1 } 
});

const entrance = dungeonA.getRoom({ x: 5, y: 5, z: 0 });
const cave = dungeonB.getRoom({ x: 0, y: 0, z: 0 });

// Create a portal between dungeons
RoomLink.createTunnel(entrance, DIRECTION.DOWN, cave);

// Player can now traverse between dungeons
const player = new Movable();
entrance.add(player);
player.step(DIRECTION.DOWN); // Now in dungeonB
assert(player.dungeon === dungeonB);
```

### Notes & details

- The `RoomLink` instance exposes `getDestination(fromRoom, direction)` which is used by `Room.getStep()` when resolving linked rooms
- Permission checks (`canEnter`/`canExit`) remain the responsibility of movement logic in `Movable`
- Calling `remove()` on a link detaches it from both rooms — the operation is idempotent
- Multiple links can exist on the same room in different directions