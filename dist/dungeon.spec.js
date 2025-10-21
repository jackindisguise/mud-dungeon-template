import assert from "node:assert";
import { describe, it } from "node:test";
import { DIRECTION, DIR2TEXT, reverseDirection, Dungeon, DungeonObject, Room, Movable, } from "./dungeon.js";
describe("Direction System", () => {
    it("should map directions to their text representations", () => {
        assert.strictEqual(DIR2TEXT.get(DIRECTION.NORTH), "north");
        assert.strictEqual(DIR2TEXT.get(DIRECTION.SOUTH), "south");
        assert.strictEqual(DIR2TEXT.get(DIRECTION.EAST), "east");
        assert.strictEqual(DIR2TEXT.get(DIRECTION.WEST), "west");
        assert.strictEqual(DIR2TEXT.get(DIRECTION.UP), "up");
        assert.strictEqual(DIR2TEXT.get(DIRECTION.DOWN), "down");
        assert.strictEqual(DIR2TEXT.get(DIRECTION.NORTHEAST), "northeast");
        assert.strictEqual(DIR2TEXT.get(DIRECTION.NORTHWEST), "northwest");
        assert.strictEqual(DIR2TEXT.get(DIRECTION.SOUTHEAST), "southeast");
        assert.strictEqual(DIR2TEXT.get(DIRECTION.SOUTHWEST), "southwest");
    });
    it("should correctly map directions to their opposites", () => {
        assert.strictEqual(reverseDirection(DIRECTION.NORTH), DIRECTION.SOUTH);
        assert.strictEqual(reverseDirection(DIRECTION.SOUTH), DIRECTION.NORTH);
        assert.strictEqual(reverseDirection(DIRECTION.EAST), DIRECTION.WEST);
        assert.strictEqual(reverseDirection(DIRECTION.WEST), DIRECTION.EAST);
        assert.strictEqual(reverseDirection(DIRECTION.UP), DIRECTION.DOWN);
        assert.strictEqual(reverseDirection(DIRECTION.DOWN), DIRECTION.UP);
        assert.strictEqual(reverseDirection(DIRECTION.NORTHEAST), DIRECTION.SOUTHWEST);
        assert.strictEqual(reverseDirection(DIRECTION.NORTHWEST), DIRECTION.SOUTHEAST);
        assert.strictEqual(reverseDirection(DIRECTION.SOUTHEAST), DIRECTION.NORTHWEST);
        assert.strictEqual(reverseDirection(DIRECTION.SOUTHWEST), DIRECTION.NORTHEAST);
    });
    it("should treat combined directions same as predefined combinations", () => {
        // Text representations
        assert.strictEqual(DIR2TEXT.get(DIRECTION.NORTH | DIRECTION.EAST), "northeast");
        assert.strictEqual(DIR2TEXT.get(DIRECTION.NORTH | DIRECTION.WEST), "northwest");
        assert.strictEqual(DIR2TEXT.get(DIRECTION.SOUTH | DIRECTION.EAST), "southeast");
        assert.strictEqual(DIR2TEXT.get(DIRECTION.SOUTH | DIRECTION.WEST), "southwest");
        // Direction reversal
        assert.strictEqual(reverseDirection(DIRECTION.NORTH | DIRECTION.EAST), DIRECTION.SOUTHWEST);
        assert.strictEqual(reverseDirection(DIRECTION.NORTH | DIRECTION.WEST), DIRECTION.SOUTHEAST);
        assert.strictEqual(reverseDirection(DIRECTION.SOUTH | DIRECTION.EAST), DIRECTION.NORTHWEST);
        assert.strictEqual(reverseDirection(DIRECTION.SOUTH | DIRECTION.WEST), DIRECTION.NORTHEAST);
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
        const dungeon = new Dungeon({
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
        const dungeon = new Dungeon({ dimensions });
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
    it("should handle room boundaries correctly", () => {
        const dungeon = new Dungeon({
            dimensions: { width: 2, height: 2, layers: 2 },
        });
        assert.strictEqual(dungeon.getRoom({ x: -1, y: 0, z: 0 }), undefined);
        assert.strictEqual(dungeon.getRoom({ x: 2, y: 0, z: 0 }), undefined);
        assert.strictEqual(dungeon.getRoom({ x: 0, y: -1, z: 0 }), undefined);
        assert.strictEqual(dungeon.getRoom({ x: 0, y: 2, z: 0 }), undefined);
        assert.strictEqual(dungeon.getRoom({ x: 0, y: 0, z: -1 }), undefined);
        assert.strictEqual(dungeon.getRoom({ x: 0, y: 0, z: 2 }), undefined);
    });
    it("should calculate steps in all directions correctly", () => {
        const dungeon = new Dungeon({
            dimensions: { width: 3, height: 3, layers: 3 },
        });
        const center = dungeon.getRoom({ x: 1, y: 1, z: 1 });
        assert(center);
        const north = dungeon.getStep({ x: 1, y: 1, z: 1 }, DIRECTION.NORTH);
        assert.deepStrictEqual(north?.coordinates, { x: 1, y: 0, z: 1 });
        const southeast = dungeon.getStep({ x: 1, y: 1, z: 1 }, DIRECTION.SOUTHEAST);
        assert.deepStrictEqual(southeast?.coordinates, { x: 2, y: 2, z: 1 });
        const up = dungeon.getStep({ x: 1, y: 1, z: 1 }, DIRECTION.UP);
        assert.deepStrictEqual(up?.coordinates, { x: 1, y: 1, z: 2 });
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
        const dungeon = new Dungeon({
            dimensions: { width: 3, height: 3, layers: 1 },
        });
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
        const dungeon = new Dungeon({
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
        const dungeon = new Dungeon({
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
        const dungeon = new Dungeon({
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
        const dungeon = new Dungeon({
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
