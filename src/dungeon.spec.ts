import assert from "node:assert";
import { describe, it } from "node:test";

import {
	DIRECTION,
	dir2text,
	dir2reverse,
	Dungeon,
	DungeonObject,
	Room,
	Movable,
	Coordinates,
} from "./dungeon.js";

describe("Direction System", () => {
	it("should map directions to their text representations", () => {
		assert.strictEqual(dir2text(DIRECTION.NORTH), "north");
		assert.strictEqual(dir2text(DIRECTION.SOUTH), "south");
		assert.strictEqual(dir2text(DIRECTION.EAST), "east");
		assert.strictEqual(dir2text(DIRECTION.WEST), "west");
		assert.strictEqual(dir2text(DIRECTION.UP), "up");
		assert.strictEqual(dir2text(DIRECTION.DOWN), "down");
		assert.strictEqual(dir2text(DIRECTION.NORTHEAST), "northeast");
		assert.strictEqual(dir2text(DIRECTION.NORTHWEST), "northwest");
		assert.strictEqual(dir2text(DIRECTION.SOUTHEAST), "southeast");
		assert.strictEqual(dir2text(DIRECTION.SOUTHWEST), "southwest");
	});

	it("should correctly map directions to their opposites", () => {
		assert.strictEqual(dir2reverse(DIRECTION.NORTH), DIRECTION.SOUTH);
		assert.strictEqual(dir2reverse(DIRECTION.SOUTH), DIRECTION.NORTH);
		assert.strictEqual(dir2reverse(DIRECTION.EAST), DIRECTION.WEST);
		assert.strictEqual(dir2reverse(DIRECTION.WEST), DIRECTION.EAST);
		assert.strictEqual(dir2reverse(DIRECTION.UP), DIRECTION.DOWN);
		assert.strictEqual(dir2reverse(DIRECTION.DOWN), DIRECTION.UP);
		assert.strictEqual(dir2reverse(DIRECTION.NORTHEAST), DIRECTION.SOUTHWEST);
		assert.strictEqual(dir2reverse(DIRECTION.NORTHWEST), DIRECTION.SOUTHEAST);
		assert.strictEqual(dir2reverse(DIRECTION.SOUTHEAST), DIRECTION.NORTHWEST);
		assert.strictEqual(dir2reverse(DIRECTION.SOUTHWEST), DIRECTION.NORTHEAST);
	});

	it("should treat combined directions same as predefined combinations", () => {
		// Text representations
		assert.strictEqual(dir2text(DIRECTION.NORTH | DIRECTION.EAST), "northeast");
		assert.strictEqual(dir2text(DIRECTION.NORTH | DIRECTION.WEST), "northwest");
		assert.strictEqual(dir2text(DIRECTION.SOUTH | DIRECTION.EAST), "southeast");
		assert.strictEqual(dir2text(DIRECTION.SOUTH | DIRECTION.WEST), "southwest");

		// Direction reversal
		assert.strictEqual(
			dir2reverse(DIRECTION.NORTH | DIRECTION.EAST),
			DIRECTION.SOUTHWEST
		);
		assert.strictEqual(
			dir2reverse(DIRECTION.NORTH | DIRECTION.WEST),
			DIRECTION.SOUTHEAST
		);
		assert.strictEqual(
			dir2reverse(DIRECTION.SOUTH | DIRECTION.EAST),
			DIRECTION.NORTHWEST
		);
		assert.strictEqual(
			dir2reverse(DIRECTION.SOUTH | DIRECTION.WEST),
			DIRECTION.NORTHEAST
		);

		// Equality checks
		assert.strictEqual(DIRECTION.NORTHEAST, DIRECTION.NORTH | DIRECTION.EAST);
		assert.strictEqual(DIRECTION.NORTHWEST, DIRECTION.NORTH | DIRECTION.WEST);
		assert.strictEqual(DIRECTION.SOUTHEAST, DIRECTION.SOUTH | DIRECTION.EAST);
		assert.strictEqual(DIRECTION.SOUTHWEST, DIRECTION.SOUTH | DIRECTION.WEST);
	});
});

describe("DungeonObject", () => {
	it("should initialize with default values", () => {
		const obj = new DungeonObject();
		assert.strictEqual(obj.keywords, "dungeon object");
		assert.strictEqual(obj.display, "Dungeon Object");
		assert.strictEqual(obj.description, "It's an object.");
		assert.deepStrictEqual(obj.contents, []);
		assert.strictEqual(obj.dungeon, undefined);
		assert.strictEqual(obj.location, undefined);
	});

	it("should manage contents correctly", () => {
		const container = new DungeonObject();
		const item = new DungeonObject();

		container.add(item);
		assert(container.contains(item));
		assert.strictEqual(item.location, container);

		container.remove(item);
		assert(!container.contains(item));
		assert.strictEqual(item.location, undefined);
	});

	it("should handle dungeon assignment and removal", () => {
		const dungeon = Dungeon.generateEmptyDungeon({
			dimensions: { width: 5, height: 5, layers: 1 },
		});
		const obj = new DungeonObject();

		obj.dungeon = dungeon;
		assert.strictEqual(obj.dungeon, dungeon);
		assert(dungeon.contains(obj));

		obj.dungeon = undefined;
		assert.strictEqual(obj.dungeon, undefined);
		assert(!dungeon.contains(obj));
	});
});

describe("Dungeon", () => {
	it("should generate rooms correctly", () => {
		const dimensions = { width: 3, height: 2, layers: 2 };
		const dungeon = Dungeon.generateEmptyDungeon({ dimensions });

		for (let z = 0; z < dimensions.layers; z++) {
			for (let y = 0; y < dimensions.height; y++) {
				for (let x = 0; x < dimensions.width; x++) {
					const room = dungeon.getRoom({ x, y, z });
					assert(room instanceof Room);
					assert.deepStrictEqual(room?.coordinates, { x, y, z });
				}
			}
		}
	});

	it("should support both object and individual coordinate parameters", () => {
		const dungeon = Dungeon.generateEmptyDungeon({
			dimensions: { width: 3, height: 3, layers: 2 },
		});

		// Test both signatures return the same room
		const roomObj = dungeon.getRoom({ x: 1, y: 1, z: 0 });
		const roomCoords = dungeon.getRoom(1, 1, 0);
		assert.strictEqual(roomObj, roomCoords);
		assert(roomObj instanceof Room);

		// Test coordinates match for both signatures
		assert.deepStrictEqual(roomObj?.coordinates, { x: 1, y: 1, z: 0 });
		assert.deepStrictEqual(roomCoords?.coordinates, { x: 1, y: 1, z: 0 });
	});

	it("should handle room boundaries correctly using object coordinates", () => {
		const dungeon = Dungeon.generateEmptyDungeon({
			dimensions: { width: 2, height: 2, layers: 2 },
		});

		assert.strictEqual(dungeon.getRoom({ x: -1, y: 0, z: 0 }), undefined);
		assert.strictEqual(dungeon.getRoom({ x: 2, y: 0, z: 0 }), undefined);
		assert.strictEqual(dungeon.getRoom({ x: 0, y: -1, z: 0 }), undefined);
		assert.strictEqual(dungeon.getRoom({ x: 0, y: 2, z: 0 }), undefined);
		assert.strictEqual(dungeon.getRoom({ x: 0, y: 0, z: -1 }), undefined);
		assert.strictEqual(dungeon.getRoom({ x: 0, y: 0, z: 2 }), undefined);
	});

	it("should handle room boundaries correctly using individual coordinates", () => {
		const dungeon = Dungeon.generateEmptyDungeon({
			dimensions: { width: 2, height: 2, layers: 2 },
		});

		assert.strictEqual(dungeon.getRoom(-1, 0, 0), undefined);
		assert.strictEqual(dungeon.getRoom(2, 0, 0), undefined);
		assert.strictEqual(dungeon.getRoom(0, -1, 0), undefined);
		assert.strictEqual(dungeon.getRoom(0, 2, 0), undefined);
		assert.strictEqual(dungeon.getRoom(0, 0, -1), undefined);
		assert.strictEqual(dungeon.getRoom(0, 0, 2), undefined);
	});

	it("should return consistent results for edge cases in both signatures", () => {
		const dungeon = Dungeon.generateEmptyDungeon({
			dimensions: { width: 2, height: 2, layers: 2 },
		});

		// Test corner coordinates with both signatures
		const cornerObj = dungeon.getRoom({ x: 1, y: 1, z: 1 });
		const cornerCoords = dungeon.getRoom(1, 1, 1);
		assert.strictEqual(cornerObj, cornerCoords);
		assert(cornerObj instanceof Room);

		// Test origin coordinates (0,0,0) with both signatures
		const originObj = dungeon.getRoom({ x: 0, y: 0, z: 0 });
		const originCoords = dungeon.getRoom(0, 0, 0);
		assert.strictEqual(originObj, originCoords);
		assert(originObj instanceof Room);

		// Test that both signatures return undefined for the same out-of-bounds coordinates
		assert.strictEqual(dungeon.getRoom({ x: 2, y: 2, z: 2 }), undefined);
		assert.strictEqual(dungeon.getRoom(2, 2, 2), undefined);
	});

	it("should calculate steps in all directions correctly", () => {
		const dungeon = Dungeon.generateEmptyDungeon({
			dimensions: { width: 3, height: 3, layers: 3 },
		});
		const center = dungeon.getRoom({ x: 1, y: 1, z: 1 });
		assert(center);

		const north = dungeon.getStep({ x: 1, y: 1, z: 1 }, DIRECTION.NORTH);
		assert.deepStrictEqual(north?.coordinates, { x: 1, y: 0, z: 1 });

		const southeast = dungeon.getStep(
			{ x: 1, y: 1, z: 1 },
			DIRECTION.SOUTHEAST
		);
		assert.deepStrictEqual(southeast?.coordinates, { x: 2, y: 2, z: 1 });

		const up = dungeon.getStep({ x: 1, y: 1, z: 1 }, DIRECTION.UP);
		assert.deepStrictEqual(up?.coordinates, { x: 1, y: 1, z: 2 });
	});
});

describe("Dungeon room creation helpers", () => {
	it("createRoom() should create a room and place it in the grid", () => {
		const dungeon = new Dungeon({
			dimensions: { width: 2, height: 2, layers: 1 },
		});
		const room = dungeon.createRoom({
			coordinates: { x: 0, y: 1, z: 0 },
		});
		assert(room instanceof Room);
		// The created room should be retrievable from the dungeon
		assert.strictEqual(dungeon.getRoom(0, 1, 0), room);
		// And the room should know its dungeon
		assert.strictEqual(room.dungeon, dungeon);
	});

	it("addRoom() should add an external Room instance and return true/false for invalid coords", () => {
		const dungeon = new Dungeon({
			dimensions: { width: 2, height: 2, layers: 1 },
		});

		// Create a room externally and add it
		const external = new Room({ coordinates: { x: 1, y: 0, z: 0 } });
		const added = dungeon.addRoom(external);
		assert.strictEqual(added, true);
		assert.strictEqual(dungeon.getRoom(1, 0, 0), external);
		assert.strictEqual(external.dungeon, dungeon);

		// Out-of-bounds room should not be added
		const bad = new Room({ coordinates: { x: 99, y: 0, z: 0 } });
		const addedBad = dungeon.addRoom(bad);
		assert.strictEqual(addedBad, false);
		// And dungeon should not reference it
		assert.strictEqual(dungeon.getRoom(99, 0, 0), undefined);
		assert.strictEqual(bad.dungeon, undefined);
	});

	it("createRoom() should return undefined for out-of-bounds coordinates", () => {
		const dungeon = new Dungeon({
			dimensions: { width: 2, height: 2, layers: 1 },
		});
		const r = dungeon.createRoom({ coordinates: { x: 2, y: 0, z: 0 } });
		assert.strictEqual(r, undefined);
	});
});

describe("Room", () => {
	it("should initialize with correct coordinates", () => {
		const coordinates = { x: 1, y: 2, z: 3 };
		const room = new Room({ coordinates });

		assert.deepStrictEqual(room.coordinates, coordinates);
		assert.strictEqual(room.x, coordinates.x);
		assert.strictEqual(room.y, coordinates.y);
		assert.strictEqual(room.z, coordinates.z);
	});

	it("should have default movement permissions", () => {
		const room = new Room({ coordinates: { x: 0, y: 0, z: 0 } });
		const movable = new Movable();

		assert(room.canEnter(movable));
		assert(room.canExit(movable));
	});
});

describe("Movable", () => {
	it("should cache and clear coordinates when moving between rooms", () => {
		const dungeon = Dungeon.generateEmptyDungeon({
			dimensions: { width: 3, height: 3, layers: 1 },
		});
		dungeon.generateRooms();
		const movable = new Movable();
		const room1 = dungeon.getRoom({ x: 0, y: 0, z: 0 });
		const room2 = dungeon.getRoom({ x: 1, y: 0, z: 0 });
		assert(room1 && room2);

		room1.add(movable);
		assert.deepStrictEqual(movable.coordinates, { x: 0, y: 0, z: 0 });

		movable.move(room2);
		assert.deepStrictEqual(movable.coordinates, { x: 1, y: 0, z: 0 });

		movable.move(undefined);
		assert.strictEqual(movable.coordinates, undefined);
	});

	it("should handle movement between rooms correctly", () => {
		const dungeon = Dungeon.generateEmptyDungeon({
			dimensions: { width: 3, height: 3, layers: 1 },
		});
		const movable = new Movable();
		const startRoom = dungeon.getRoom({ x: 1, y: 1, z: 0 });
		assert(startRoom);
		startRoom.add(movable);

		assert(movable.canStep(DIRECTION.NORTH));
		movable.step(DIRECTION.NORTH);
		assert.deepStrictEqual(movable.coordinates, { x: 1, y: 0, z: 0 });

		assert(!movable.canStep(DIRECTION.NORTH)); // Should be blocked by dungeon boundary
	});

	it("should not allow movement outside dungeon boundaries", () => {
		const dungeon = Dungeon.generateEmptyDungeon({
			dimensions: { width: 3, height: 3, layers: 1 },
		});
		const movable = new Movable();
		const edgeRoom = dungeon.getRoom({ x: 0, y: 0, z: 0 });
		assert(edgeRoom);
		edgeRoom.add(movable);

		assert(!movable.canStep(DIRECTION.NORTH));
		assert(!movable.canStep(DIRECTION.WEST));
		movable.step(DIRECTION.NORTH); // Should not move
		assert.deepStrictEqual(movable.coordinates, { x: 0, y: 0, z: 0 });
	});

	it("should handle movement in all directions correctly", () => {
		const dungeon = Dungeon.generateEmptyDungeon({
			dimensions: { width: 3, height: 3, layers: 3 },
		});
		const movable = new Movable();
		const centerRoom = dungeon.getRoom({ x: 1, y: 1, z: 1 });
		assert(centerRoom);
		centerRoom.add(movable);

		// Test NORTH movement
		assert(movable.canStep(DIRECTION.NORTH));
		movable.step(DIRECTION.NORTH);
		assert.deepStrictEqual(movable.coordinates, { x: 1, y: 0, z: 1 });

		// Return to center
		movable.step(DIRECTION.SOUTH);
		assert.deepStrictEqual(movable.coordinates, { x: 1, y: 1, z: 1 });

		// Test EAST movement
		assert(movable.canStep(DIRECTION.EAST));
		movable.step(DIRECTION.EAST);
		assert.deepStrictEqual(movable.coordinates, { x: 2, y: 1, z: 1 });

		// Return to center
		movable.step(DIRECTION.WEST);
		assert.deepStrictEqual(movable.coordinates, { x: 1, y: 1, z: 1 });

		// Test SOUTH movement
		assert(movable.canStep(DIRECTION.SOUTH));
		movable.step(DIRECTION.SOUTH);
		assert.deepStrictEqual(movable.coordinates, { x: 1, y: 2, z: 1 });

		// Return to center
		movable.step(DIRECTION.NORTH);
		assert.deepStrictEqual(movable.coordinates, { x: 1, y: 1, z: 1 });

		// Test WEST movement
		assert(movable.canStep(DIRECTION.WEST));
		movable.step(DIRECTION.WEST);
		assert.deepStrictEqual(movable.coordinates, { x: 0, y: 1, z: 1 });

		// Return to center
		movable.step(DIRECTION.EAST);
		assert.deepStrictEqual(movable.coordinates, { x: 1, y: 1, z: 1 });

		// Test UP movement
		assert(movable.canStep(DIRECTION.UP));
		movable.step(DIRECTION.UP);
		assert.deepStrictEqual(movable.coordinates, { x: 1, y: 1, z: 2 });

		// Return to center
		movable.step(DIRECTION.DOWN);
		assert.deepStrictEqual(movable.coordinates, { x: 1, y: 1, z: 1 });

		// Test DOWN movement
		assert(movable.canStep(DIRECTION.DOWN));
		movable.step(DIRECTION.DOWN);
		assert.deepStrictEqual(movable.coordinates, { x: 1, y: 1, z: 0 });

		// Return to center
		movable.step(DIRECTION.UP);
		assert.deepStrictEqual(movable.coordinates, { x: 1, y: 1, z: 1 });

		// Test NORTHEAST movement
		assert(movable.canStep(DIRECTION.NORTHEAST));
		movable.step(DIRECTION.NORTHEAST);
		assert.deepStrictEqual(movable.coordinates, { x: 2, y: 0, z: 1 });

		// Return to center
		movable.step(DIRECTION.SOUTHWEST);
		assert.deepStrictEqual(movable.coordinates, { x: 1, y: 1, z: 1 });

		// Test NORTHWEST movement
		assert(movable.canStep(DIRECTION.NORTHWEST));
		movable.step(DIRECTION.NORTHWEST);
		assert.deepStrictEqual(movable.coordinates, { x: 0, y: 0, z: 1 });

		// Return to center
		movable.step(DIRECTION.SOUTHEAST);
		assert.deepStrictEqual(movable.coordinates, { x: 1, y: 1, z: 1 });

		// Test SOUTHEAST movement
		assert(movable.canStep(DIRECTION.SOUTHEAST));
		movable.step(DIRECTION.SOUTHEAST);
		assert.deepStrictEqual(movable.coordinates, { x: 2, y: 2, z: 1 });

		// Return to center
		movable.step(DIRECTION.NORTHWEST);
		assert.deepStrictEqual(movable.coordinates, { x: 1, y: 1, z: 1 });

		// Test SOUTHWEST movement
		assert(movable.canStep(DIRECTION.SOUTHWEST));
		movable.step(DIRECTION.SOUTHWEST);
		assert.deepStrictEqual(movable.coordinates, { x: 0, y: 2, z: 1 });

		// Return to center
		movable.step(DIRECTION.NORTHEAST);
		assert.deepStrictEqual(movable.coordinates, { x: 1, y: 1, z: 1 });
	});

	it("should handle movement with combined directions", () => {
		const dungeon = Dungeon.generateEmptyDungeon({
			dimensions: { width: 3, height: 3, layers: 3 },
		});
		const movable = new Movable();
		const centerRoom = dungeon.getRoom({ x: 1, y: 1, z: 1 });
		assert(centerRoom);
		centerRoom.add(movable);

		// Test combined NORTH|EAST movement
		assert(movable.canStep(DIRECTION.NORTH | DIRECTION.EAST));
		movable.step(DIRECTION.NORTH | DIRECTION.EAST);
		assert.deepStrictEqual(movable.coordinates, { x: 2, y: 0, z: 1 });

		// Return to center using combined SOUTH|WEST
		movable.step(DIRECTION.SOUTH | DIRECTION.WEST);
		assert.deepStrictEqual(movable.coordinates, { x: 1, y: 1, z: 1 });

		// Test combined NORTH|WEST movement
		assert(movable.canStep(DIRECTION.NORTH | DIRECTION.WEST));
		movable.step(DIRECTION.NORTH | DIRECTION.WEST);
		assert.deepStrictEqual(movable.coordinates, { x: 0, y: 0, z: 1 });

		// Return to center using combined SOUTH|EAST
		movable.step(DIRECTION.SOUTH | DIRECTION.EAST);
		assert.deepStrictEqual(movable.coordinates, { x: 1, y: 1, z: 1 });

		// Test combined SOUTH|EAST movement
		assert(movable.canStep(DIRECTION.SOUTH | DIRECTION.EAST));
		movable.step(DIRECTION.SOUTH | DIRECTION.EAST);
		assert.deepStrictEqual(movable.coordinates, { x: 2, y: 2, z: 1 });

		// Return to center using combined NORTH|WEST
		movable.step(DIRECTION.NORTH | DIRECTION.WEST);
		assert.deepStrictEqual(movable.coordinates, { x: 1, y: 1, z: 1 });

		// Test combined SOUTH|WEST movement
		assert(movable.canStep(DIRECTION.SOUTH | DIRECTION.WEST));
		movable.step(DIRECTION.SOUTH | DIRECTION.WEST);
		assert.deepStrictEqual(movable.coordinates, { x: 0, y: 2, z: 1 });

		// Return to center using combined NORTH|EAST
		movable.step(DIRECTION.NORTH | DIRECTION.EAST);
		assert.deepStrictEqual(movable.coordinates, { x: 1, y: 1, z: 1 });

		// Verify that combined directions work exactly like their predefined counterparts
		assert(movable.canStep(DIRECTION.NORTHEAST));
		assert(movable.canStep(DIRECTION.NORTH | DIRECTION.EAST));
		movable.step(DIRECTION.NORTH | DIRECTION.EAST);
		const combinedCoords = movable.coordinates;

		// Return and try with predefined
		movable.step(DIRECTION.SOUTHWEST);
		movable.step(DIRECTION.NORTHEAST);
		assert.deepStrictEqual(movable.coordinates, combinedCoords);
	});
});
