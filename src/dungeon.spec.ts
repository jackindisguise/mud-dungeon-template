import assert from "node:assert";
import { suite, test } from "node:test";

import {
	DIRECTION,
	dir2text,
	dir2reverse,
	Dungeon,
	DungeonObject,
	Room,
	DUNGEON_REGISTRY,
	getDungeonById,
	getRoomByRef,
	Movable,
	RoomLink,
} from "./dungeon.js";

function xit(...args: any[]) {}

suite("DIRECTION", () => {
	test("should map directions to their text representations", () => {
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

	test("should correctly map directions to their opposites", () => {
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

	test("should treat combined directions same as predefined combinations", () => {
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

suite("DungeonObject", () => {
	test("should initialize with default values", () => {
		const obj = new DungeonObject();
		assert.strictEqual(obj.keywords, "dungeon object");
		assert.strictEqual(obj.display, "Dungeon Object");
		assert.strictEqual(obj.description, "It's an object.");
		assert.deepStrictEqual(obj.contents, []);
		assert.strictEqual(obj.dungeon, undefined);
		assert.strictEqual(obj.location, undefined);
	});

	test("should manage contents correctly", () => {
		const container = new DungeonObject();
		const item = new DungeonObject();

		container.add(item);
		assert(container.contains(item));
		assert.strictEqual(item.location, container);

		container.remove(item);
		assert(!container.contains(item));
		assert.strictEqual(item.location, undefined);
	});

	test("should handle dungeon assignment and removal", () => {
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

suite("Dungeon", () => {
	test("generateEmptyDungeon() should generate rooms correctly", () => {
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

	test("getRoom() should support both Coordinates and individual coordinate parameters", () => {
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

	test("getRoom() should handle room boundaries correctly using Coordinates", () => {
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

	test("getRoom() should handle room boundaries correctly using individual coordinates", () => {
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

	test("getRoom() should return consistent results", () => {
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

	test("getStep() should calculate steps in all directions correctly", () => {
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

suite("getDungeonById", () => {
	test("should not register a dungeon when no id is provided", () => {
		const d = new Dungeon({ dimensions: { width: 1, height: 1, layers: 1 } });
		assert.strictEqual(d.id, undefined);
	});

	test("should register a dungeon when an id is provided and allow lookup", () => {
		const id = "test-registry-1";
		const d = new Dungeon({
			id,
			dimensions: { width: 1, height: 1, layers: 1 },
		});
		try {
			assert.strictEqual(d.id, id);
			assert.strictEqual(getDungeonById(id), d);
			assert.strictEqual(DUNGEON_REGISTRY.get(id), d);
		} finally {
			// cleanup so registry doesn't leak into other tests
			DUNGEON_REGISTRY.delete(id);
		}
	});

	test("should throw when attempting to create a second dungeon with the same id", () => {
		const id = "test-duplicate-id";
		const first = new Dungeon({
			id,
			dimensions: { width: 1, height: 1, layers: 1 },
		});
		try {
			assert.strictEqual(getDungeonById(id), first);
			assert.throws(() => {
				// second construction should throw due to duplicate id
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const second = new Dungeon({
					id,
					dimensions: { width: 1, height: 1, layers: 1 },
				});
			}, Error);
		} finally {
			DUNGEON_REGISTRY.delete(id);
		}
	});
});

suite("getRoomByRef", () => {
	test("should return a room for a valid reference format", () => {
		const id = "test-get-room-ref-1";
		const dungeon = Dungeon.generateEmptyDungeon({
			id,
			dimensions: { width: 5, height: 5, layers: 2 },
		});
		try {
			const room = getRoomByRef(`@${id}{2,3,1}`);
			assert(room instanceof Room);
			assert.deepStrictEqual(room.coordinates, { x: 2, y: 3, z: 1 });
			assert.strictEqual(room.dungeon, dungeon);
		} finally {
			DUNGEON_REGISTRY.delete(id);
		}
	});

	test("should return undefined for invalid reference formats", () => {
		assert.strictEqual(getRoomByRef("invalid"), undefined);
		assert.strictEqual(getRoomByRef("@dungeon"), undefined);
		assert.strictEqual(getRoomByRef("@dungeon{1,2}"), undefined);
		assert.strictEqual(getRoomByRef("@dungeon{a,b,c}"), undefined);
		assert.strictEqual(getRoomByRef("dungeon{1,2,3}"), undefined);
		assert.strictEqual(getRoomByRef("@{1,2,3}"), undefined);
		assert.strictEqual(getRoomByRef("@dungeon{1,2,3"), undefined);
		assert.strictEqual(getRoomByRef("@dungeon 1,2,3}"), undefined);
	});

	test("should return undefined when dungeon ID does not exist", () => {
		const room = getRoomByRef("@nonexistent-dungeon{0,0,0}");
		assert.strictEqual(room, undefined);
	});

	test("should return undefined for out-of-bounds coordinates", () => {
		const id = "test-get-room-ref-bounds";
		const dungeon = Dungeon.generateEmptyDungeon({
			id,
			dimensions: { width: 3, height: 3, layers: 2 },
		});
		try {
			// Valid coordinates first
			const valid = getRoomByRef(`@${id}{1,1,1}`);
			assert(valid instanceof Room);

			// Out of bounds
			assert.strictEqual(getRoomByRef(`@${id}{5,5,5}`), undefined);
			assert.strictEqual(getRoomByRef(`@${id}{-1,0,0}`), undefined);
			assert.strictEqual(getRoomByRef(`@${id}{0,-1,0}`), undefined);
			assert.strictEqual(getRoomByRef(`@${id}{0,0,-1}`), undefined);
			assert.strictEqual(getRoomByRef(`@${id}{3,0,0}`), undefined);
			assert.strictEqual(getRoomByRef(`@${id}{0,3,0}`), undefined);
			assert.strictEqual(getRoomByRef(`@${id}{0,0,2}`), undefined);
		} finally {
			DUNGEON_REGISTRY.delete(id);
		}
	});

	test("should handle dungeon IDs with special characters", () => {
		const id = "test-dungeon_with-special.chars";
		const dungeon = Dungeon.generateEmptyDungeon({
			id,
			dimensions: { width: 2, height: 2, layers: 1 },
		});
		try {
			const room = getRoomByRef(`@${id}{0,1,0}`);
			assert(room instanceof Room);
			assert.deepStrictEqual(room.coordinates, { x: 0, y: 1, z: 0 });
		} finally {
			DUNGEON_REGISTRY.delete(id);
		}
	});
});

suite("Room", () => {
	test("should initialize with correct coordinates", () => {
		const coordinates = { x: 1, y: 2, z: 3 };
		const room = new Room({ coordinates });

		assert.deepStrictEqual(room.coordinates, coordinates);
		assert.strictEqual(room.x, coordinates.x);
		assert.strictEqual(room.y, coordinates.y);
		assert.strictEqual(room.z, coordinates.z);
	});

	test("should have default movement permissions", () => {
		const room = new Room({ coordinates: { x: 0, y: 0, z: 0 } });
		const movable = new Movable();

		assert(room.canEnter(movable));
		assert(room.canExit(movable));
	});
});

suite("RoomLink", () => {
	test("should create bidirectional portals between rooms", () => {
		const dungeon = Dungeon.generateEmptyDungeon({
			dimensions: { width: 3, height: 3, layers: 1 },
		});
		const roomA = dungeon.getRoom({ x: 0, y: 0, z: 0 });
		const roomB = dungeon.getRoom({ x: 2, y: 2, z: 0 });
		assert(roomA && roomB);

		const link = RoomLink.createTunnel(roomA, DIRECTION.NORTH, roomB);

		// Test that moving NORTH from roomA leads to roomB
		const northStep = roomA.getStep(DIRECTION.NORTH);
		assert.strictEqual(northStep, roomB);

		// Test that moving SOUTH from roomB leads back to roomA
		const southStep = roomB.getStep(DIRECTION.SOUTH);
		assert.strictEqual(southStep, roomA);

		// Test that other directions are unaffected
		assert.notStrictEqual(roomA.getStep(DIRECTION.EAST), roomB);
		assert.notStrictEqual(roomB.getStep(DIRECTION.WEST), roomA);
	});

	test("should work with rooms in different dungeons", () => {
		const dungeonA = Dungeon.generateEmptyDungeon({
			dimensions: { width: 2, height: 2, layers: 1 },
		});
		const dungeonB = Dungeon.generateEmptyDungeon({
			dimensions: { width: 2, height: 2, layers: 1 },
		});

		const roomA = dungeonA.getRoom({ x: 0, y: 0, z: 0 });
		const roomB = dungeonB.getRoom({ x: 1, y: 1, z: 0 });
		assert(roomA && roomB);

		const link = RoomLink.createTunnel(roomA, DIRECTION.EAST, roomB);

		// Test movement between dungeons
		const player = new Movable();
		roomA.add(player);

		assert(player.canStep(DIRECTION.EAST));
		player.step(DIRECTION.EAST);
		assert(player.location === roomB);
		assert(player.dungeon === dungeonB);

		assert(player.canStep(DIRECTION.WEST));
		player.step(DIRECTION.WEST);
		assert(player.location === roomA);
		assert(player.dungeon === dungeonA);
	});

	test("should allow removal of links", () => {
		const dungeon = Dungeon.generateEmptyDungeon({
			dimensions: { width: 3, height: 3, layers: 1 },
		});
		const roomA = dungeon.getRoom({ x: 0, y: 0, z: 0 });
		const roomB = dungeon.getRoom({ x: 2, y: 2, z: 0 });
		assert(roomA && roomB);

		const link = RoomLink.createTunnel(roomA, DIRECTION.UP, roomB);

		// Verify link works
		assert.strictEqual(roomA.getStep(DIRECTION.UP), roomB);
		assert.strictEqual(roomB.getStep(DIRECTION.DOWN), roomA);

		// Remove link
		link.remove();

		// Verify normal spatial relationships are restored
		assert.strictEqual(roomA.getStep(DIRECTION.UP), undefined);
		assert.strictEqual(roomB.getStep(DIRECTION.DOWN), undefined);
	});

	test("should handle multiple links per room", () => {
		const dungeon = Dungeon.generateEmptyDungeon({
			dimensions: { width: 3, height: 3, layers: 1 },
		});
		const center = dungeon.getRoom({ x: 1, y: 1, z: 0 });
		const north = dungeon.getRoom({ x: 1, y: 0, z: 0 });
		const south = dungeon.getRoom({ x: 1, y: 2, z: 0 });
		const east = dungeon.getRoom({ x: 2, y: 1, z: 0 });
		assert(center && north && south && east);

		// Create portal from center to each other room
		const link1 = RoomLink.createTunnel(center, DIRECTION.UP, north);
		const link2 = RoomLink.createTunnel(center, DIRECTION.DOWN, south);
		const link3 = RoomLink.createTunnel(center, DIRECTION.WEST, east);

		// Test all portals work
		assert.strictEqual(center.getStep(DIRECTION.UP), north);
		assert.strictEqual(center.getStep(DIRECTION.DOWN), south);
		assert.strictEqual(center.getStep(DIRECTION.WEST), east);

		// Test return trips
		assert.strictEqual(north.getStep(DIRECTION.DOWN), center);
		assert.strictEqual(south.getStep(DIRECTION.UP), center);
		assert.strictEqual(east.getStep(DIRECTION.EAST), center);

		// Remove middle link
		link2.remove();

		// Verify other links still work
		assert.strictEqual(center.getStep(DIRECTION.UP), north);
		assert.strictEqual(center.getStep(DIRECTION.WEST), east);
		assert.strictEqual(north.getStep(DIRECTION.DOWN), center);
		assert.strictEqual(east.getStep(DIRECTION.EAST), center);

		// But removed link doesn't
		assert.strictEqual(center.getStep(DIRECTION.DOWN), undefined);
		assert.strictEqual(south.getStep(DIRECTION.UP), undefined);
	});

	test("should support one-way links", () => {
		const dungeon = Dungeon.generateEmptyDungeon({
			dimensions: { width: 3, height: 3, layers: 1 },
		});
		const roomA = dungeon.getRoom({ x: 0, y: 0, z: 0 });
		const roomB = dungeon.getRoom({ x: 2, y: 2, z: 0 });
		assert(roomA && roomB);

		const link = RoomLink.createTunnel(roomA, DIRECTION.EAST, roomB, true);

		// Forward direction should resolve
		assert(roomA.getStep(DIRECTION.EAST) === roomB);
		// Reverse direction should NOT resolve to the originating room
		assert(roomB.getStep(DIRECTION.WEST) !== roomA);

		// Movable can traverse forward across the one-way link
		const player = new Movable();
		roomA.add(player);
		assert(player.canStep(DIRECTION.EAST));
		player.step(DIRECTION.EAST);
		assert.strictEqual(player.location, roomB);
		// Attempting to go back should not land the player in roomA via the link
		player.step(DIRECTION.WEST);
		assert.notStrictEqual(player.location, roomA);

		// Cleanup - removing the link must not point roomA->roomB anymore
		link.remove();
		assert.notStrictEqual(roomA.getStep(DIRECTION.EAST), roomB);
	});
});

suite("Movable", () => {
	test("should cache and clear coordinates when moving between rooms", () => {
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

	test("should handle movement between rooms correctly", () => {
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

	test("should not allow movement outside dungeon boundaries", () => {
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

	test("should handle movement in all directions correctly", () => {
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

	test("should handle movement with combined directions", () => {
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
