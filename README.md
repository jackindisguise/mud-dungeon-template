[![Static Badge](https://img.shields.io/badge/documentation-orange)](https://jackindisguise.github.io/mud-dungeon-template/)

# MUD Dungeon System

A 3D room/grid system for text-based games (MUDs). It provides room objects, containment hierarchies, movement primitives, and an extensible linking system that lets you override spatial relationships between rooms (including one-way portals).

## Directional movement

The system represents directions using bitwise flags which enables combining directions (e.g. north + east -> northeast).

- `DIRECTION` — enum of cardinal, vertical and composite directions.
- `dir2text(dir)` — convert a DIRECTION to human-readable text.
- `dir2reverse(dir)` — returns the opposite direction.

### Examples

```ts
// Cardinal directions
DIRECTION.NORTH, DIRECTION.SOUTH, DIRECTION.EAST, DIRECTION.WEST

// Vertical
DIRECTION.UP, DIRECTION.DOWN

// Combine flags for diagonals
const diag = DIRECTION.NORTH | DIRECTION.EAST; // same as DIRECTION.NORTHEAST
```

## Dungeon and Rooms

Use `Dungeon` to create a 3D grid of rooms. Rooms are addressed by `{x, y, z}` coordinates.

```ts
const dungeon = Dungeon.generateEmptyDungeon({ dimensions: { width: 10, height: 10, layers: 3 } });
const room = dungeon.getRoom({ x: 0, y: 0, z: 0 });
const northRoom = room.getStep(DIRECTION.NORTH);
```

Rooms are `DungeonObject`s and support containment, naming (keywords/display/description), and movement hooks:

- `canEnter(movable, direction?)` — override to restrict entry
- `canExit(movable, direction?)` — override to restrict exiting
- `onEnter(movable, direction?)` / `onExit(movable, direction?)` — event hooks

## Objects and Movables

`DungeonObject` is the base for represented items/containers. `Movable` extends it with movement helpers and coordinate caching.

### Examples

```ts
const sword = new DungeonObject({ keywords: "sword blade", display: "a sword" });
const player = new Movable();
room.add(player);
if (player.canStep(DIRECTION.NORTH)) player.step(DIRECTION.NORTH);
```

## Room links (portals/tunnels)

A construction pattern for non-Euclidean room links, plus support for one-way portals.

- `RoomLink.createTunnel(fromRoom, direction, toRoom, oneWay = false)`
  - Creates and registers a link.
  - `direction` is the direction on `fromRoom` that leads to `toRoom`.
  - If `oneWay` is true, the link will only be active from `fromRoom` -> `toRoom` (no return traversal).
  - Otherwise, all tunnels are two-way.
  - The `RoomLink` constructor is private — use the factory.

### Examples

Two-way link (default):

```ts
// moving NORTH from roomA will take you to roomB
const link = RoomLink.createTunnel(roomA, DIRECTION.NORTH, roomB);

// now
assert(roomA.getStep(DIRECTION.NORTH) === roomB);
assert(roomB.getStep(DIRECTION.SOUTH) === roomA);
```

One-way link:

```ts
// moving EAST from roomA goes to roomB, but moving WEST from roomB will NOT return to roomA
const oneWay = RoomLink.createTunnel(roomA, DIRECTION.EAST, roomB, true);

assert(roomA.getStep(DIRECTION.EAST) === roomB);
assert.notStrictEqual(roomB.getStep(DIRECTION.WEST), roomA);
```

Notes & details

- The factory infers the reverse direction using `dir2reverse(direction)`; if the reverse cannot be inferred an error is thrown. This protects against accidental mismatches.
- The `RoomLink` instance exposes `getDestination(fromRoom, direction)` which is used by `Room.getStep()` when resolving linked rooms. Permission checks (canEnter/canExit) remain the responsibility of the caller (e.g., movement logic in `Movable`).
- Calling `remove()` on a link detaches it from both rooms — the operation is idempotent.