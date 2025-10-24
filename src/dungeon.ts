import { string } from "mud-ext";

/**
 * Enum for handling directional movement in the dungeon.
 * Uses bitwise flags to allow for composite directions (diagonals).
 *
 * Basic directions are powers of 2 (using bit shifts),
 * while diagonal directions are combinations of cardinal directions using bitwise OR.
 *
 * @example
 * ```typescript
 * // Using basic directions
 * player.step(DIRECTION.NORTH);
 * player.step(DIRECTION.UP);
 *
 * // Using diagonal directions
 * player.step(DIRECTION.NORTHEAST);
 *
 * // Creating diagonal directions manually (same as predefined)
 * const diagonal = DIRECTION.NORTH | DIRECTION.EAST; // Same as DIRECTION.NORTHEAST
 * player.step(diagonal);
 *
 * // Checking if a direction contains a component
 * const hasNorth = (DIRECTION.NORTHEAST & DIRECTION.NORTH) !== 0; // true
 * const hasUp = (DIRECTION.NORTHEAST & DIRECTION.UP) !== 0; // false
 * ```
 */
export enum DIRECTION {
	NORTH = 1 << 0,
	SOUTH = 1 << 1,
	EAST = 1 << 2,
	WEST = 1 << 3,
	UP = 1 << 4,
	DOWN = 1 << 5,
	NORTHEAST = NORTH | EAST,
	NORTHWEST = NORTH | WEST,
	SOUTHEAST = SOUTH | EAST,
	SOUTHWEST = SOUTH | WEST,
}

/**
 * Maps each direction to its opposite direction.
 * Includes both cardinal and diagonal directions.
 * Used for calculating reverse movements and entry/exit directions.
 *
 * @example
 * ```typescript
 * // Get opposite of a direction
 * const south = DIR2REVERSE.get(DIRECTION.NORTH); // DIRECTION.SOUTH
 *
 * // Get opposite of a diagonal
 * const southwest = DIR2REVERSE.get(DIRECTION.NORTHEAST); // DIRECTION.SOUTHWEST
 *
 * // Using with room entry/exit
 * room.onEnter(player, DIR2REVERSE.get(exitDirection)); // Get entry direction from exit
 * ```
 */
const DIR2REVERSE = new Map<DIRECTION, DIRECTION>([
	[DIRECTION.NORTH, DIRECTION.SOUTH],
	[DIRECTION.SOUTH, DIRECTION.NORTH],
	[DIRECTION.EAST, DIRECTION.WEST],
	[DIRECTION.WEST, DIRECTION.EAST],
	[DIRECTION.UP, DIRECTION.DOWN],
	[DIRECTION.DOWN, DIRECTION.UP],

	// combinations
	[DIRECTION.NORTHEAST, DIRECTION.SOUTHWEST],
	[DIRECTION.NORTHWEST, DIRECTION.SOUTHEAST],
	[DIRECTION.SOUTHEAST, DIRECTION.NORTHWEST],
	[DIRECTION.SOUTHWEST, DIRECTION.NORTHEAST],
]);

/**
 * Gets the opposite direction for a given direction.
 * Works with both cardinal and diagonal directions.
 * Used primarily for calculating entry directions from exit directions
 * and vice versa.
 *
 * @param dir - The direction to reverse
 * @returns The opposite direction, or undefined if the direction is invalid
 *
 * @example
 * ```typescript
 * // Basic direction reversal
 * const south = dir2reverse(DIRECTION.NORTH); // Returns DIRECTION.SOUTH
 * const up = dir2reverse(DIRECTION.DOWN); // Returns DIRECTION.UP
 *
 * // Diagonal direction reversal
 * const southwest = dir2reverse(DIRECTION.NORTHEAST); // Returns DIRECTION.SOUTHWEST
 *
 * // Using with room movement
 * if (room.canExit(player, DIRECTION.NORTH)) {
 *   const nextRoom = room.getStep(DIRECTION.NORTH);
 *   // Check if we can enter from the opposite direction
 *   if (nextRoom.canEnter(player, dir2reverse(DIRECTION.NORTH))) {
 *     player.step(DIRECTION.NORTH);
 *   }
 * }
 * ```
 */
export function dir2reverse(dir: DIRECTION) {
	return DIR2REVERSE.get(dir);
}

/**
 * Maps directions to their string representations.
 * Used for displaying directions in user interfaces and commands.
 * Handles both cardinal and diagonal directions.
 *
 * @example
 * ```typescript
 * // Get text for basic direction
 * console.log(DIR2TEXT.get(DIRECTION.NORTH)); // "north"
 *
 * // Get text for diagonal direction
 * console.log(DIR2TEXT.get(DIRECTION.NORTHEAST)); // "northeast"
 *
 * // Get text for combined direction (same as predefined diagonal)
 * console.log(DIR2TEXT.get(DIRECTION.NORTH | DIRECTION.EAST)); // "northeast"
 *
 * // Use in command processing
 * function move(directionText: string) {
 *   for (const [dir, text] of DIR2TEXT.entries()) {
 *     if (text === directionText) {
 *       player.step(dir);
 *       break;
 *     }
 *   }
 * }
 * ```
 */
const DIR2TEXT = new Map<DIRECTION, string>([
	[DIRECTION.NORTH, "north"],
	[DIRECTION.SOUTH, "south"],
	[DIRECTION.EAST, "east"],
	[DIRECTION.WEST, "west"],

	// up/down
	[DIRECTION.UP, "up"],
	[DIRECTION.DOWN, "down"],

	// combinations
	[DIRECTION.NORTHEAST, "northeast"],
	[DIRECTION.NORTHWEST, "northwest"],
	[DIRECTION.SOUTHEAST, "southeast"],
	[DIRECTION.SOUTHWEST, "southwest"],
]);

/**
 * Convert a DIRECTION flag into its user-facing text representation.
 * Handles both cardinal and composite (diagonal) directions.
 *
 * @param dir The direction flag or combination of flags to convert
 * @returns The textual representation (e.g. "north", "northeast") or `undefined` if unknown
 *
 * @example
 * ```typescript
 * console.log(dir2text(DIRECTION.NORTH)); // "north"
 * console.log(dir2text(DIRECTION.NORTHEAST)); // "northeast"
 * ```
 */
export function dir2text(dir: DIRECTION) {
	return DIR2TEXT.get(dir);
}

/**
 * Defines the dimensions of a dungeon's room grid.
 * Represents a three-dimensional space where rooms can exist.
 *
 * @property width - Number of rooms along the X axis (east-west)
 * @property height - Number of rooms along the Y axis (north-south)
 * @property layers - Number of rooms along the Z axis (up-down)
 *
 * @example
 * ```typescript
 * const dimensions: MapDimensions = {
 *   width: 10,   // 10 rooms wide (x-axis)
 *   height: 10,  // 10 rooms tall (y-axis)
 *   layers: 3    // 3 vertical levels (z-axis)
 * };
 * ```
 */
export type MapDimensions = {
	width: number;
	height: number;
	layers: number;
};

/**
 * Configuration options for creating a new Dungeon instance.
 * Currently only contains dimensions, but designed to be extensible for future options.
 *
 * @property dimensions - The size of the dungeon in all three dimensions
 *
 * @example
 * ```typescript
 * const options: DungeonOptions = {
 *   dimensions: {
 *     width: 10,
 *     height: 10,
 *     layers: 3
 *   }
 * };
 *
 * const dungeon = new Dungeon(options);
 * ```
 */
export type DungeonOptions = {
	dimensions: MapDimensions;
};

/**
 * The main container class that manages a three-dimensional map..
 * Creates and maintains a grid of interconnected rooms and manages all objects within the dungeon.
 *
 * @example
 * ```typescript
 * // Create a new dungeon with specific dimensions
 * const dungeon = Dungeon.generateEmptyDungeon({
 *   dimensions: { width: 10, height: 10, layers: 3 }
 * });
 *
 * // Get a room at specific coordinates
 * const room = dungeon.getRoom({ x: 0, y: 0, z: 0 });
 *
 * // Add objects to the room
 * const object = new DungeonObject();
 * room.add(object);
 *
 * // Add objects to the object
 * const object2 = new DungeonObject();
 * object.add(object2);
 *
 * // Dungeon contains the room *and* its contents
 * console.log(dungeon.contains(room) === true)
 * console.log(dungeon.contains(object) === true)
 * console.log(dungeon.contains(object2) === true)
 * ```
 */
export class Dungeon {
	/**
	 * Three-dimensional array of rooms that makes up the dungeon grid.
	 * Indexed as [z][y][x] for vertical layers, rows, and columns respectively.
	 * Can be undefined before grid initialization or contain undefined slots
	 * for ungenerated rooms.
	 */
	private _rooms?: (Room | undefined)[][][];

	/**
	 * Registry of all objects that exist in this dungeon, regardless of their
	 * containment relationships. This includes rooms, items, creatures, and any
	 * other objects that are part of the dungeon hierarchy.
	 */
	private _contents: DungeonObject[] = [];

	/**
	 * The size of the dungeon in all three dimensions. Used for bounds checking
	 * and room generation. These dimensions are immutable after creation.
	 */
	private _dimensions: MapDimensions;

	/**
	 * Creates a new dungeon and populates it with empty rooms.
	 * This is a convenience method that creates a dungeon instance and
	 * immediately calls generateRooms() to fill it with Room objects.
	 *
	 * @param options Configuration options for the dungeon
	 * @returns A new Dungeon instance with all rooms initialized
	 *
	 * @example
	 * ```typescript
	 * // Create a fully populated 5x5x2 dungeon
	 * const dungeon = Dungeon.generateEmptyDungeon({
	 *   dimensions: { width: 5, height: 5, layers: 2 }
	 * });
	 *
	 * // All rooms are already created and accessible
	 * const room = dungeon.getRoom({ x: 0, y: 0, z: 0 });
	 * console.log(room instanceof Room); // true
	 * ```
	 */
	static generateEmptyDungeon(options: DungeonOptions) {
		const dungeon = new Dungeon(options);
		dungeon.generateRooms();
		return dungeon;
	}

	/**
	 * Create a new Dungeon instance.
	 *
	 * @param options Configuration options for the dungeon
	 * @param options.dimensions The three-dimensional size of the dungeon grid
	 *
	 * @example
	 * ```typescript
	 * // Create a 10x10 dungeon with 3 vertical layers
	 * const dungeon = new Dungeon({ dimensions: { width: 10, height: 10, layers: 3 } });
	 * ```
	 */
	constructor(options: DungeonOptions) {
		this._dimensions = options.dimensions;
		this.generateGrid();
	}

	/**
	 * Gets a safe, shallow copy of the dungeon's contents.
	 * Returns all objects that exist in the dungeon, regardless of their location
	 * within the dungeon's containment hierarchy.
	 *
	 * @returns An array containing all objects in the dungeon
	 *
	 * @example
	 * ```typescript
	 * // Create a dungeon with some objects
	 * const dungeon = Dungeon.generateEmptyDungeon({ dimensions: { width: 10, height: 10, layers: 1 } });
	 * const room = dungeon.getRoom({ x: 0, y: 0, z: 0 });
	 * const player = new Movable();
	 * const sword = new DungeonObject();
	 *
	 * // Add objects to the dungeon
	 * room.add(player);
	 * player.add(sword);
	 *
	 * // All objects are tracked by the dungeon
	 * const allObjects = dungeon.contents;
	 * console.log(allObjects.includes(room)); // true
	 * console.log(allObjects.includes(player)); // true
	 * console.log(allObjects.includes(sword)); // true
	 * ```
	 */
	get contents() {
		return [...this._contents];
	}

	/**
	 * Add objects to this dungeon's registry of all contained objects.
	 * Also sets the object's dungeon reference to this dungeon.
	 *
	 * @param dobjs The objects to add to this dungeon
	 *
	 * @example
	 * ```typescript
	 * const dungeon = Dungeon.generateEmptyDungeon({ dimensions: { width: 5, height: 5, layers: 1 } });
	 * const room = dungeon.getRoom({ x: 0, y: 0, z: 0 });
	 * const chest = new DungeonObject();
	 * const coin = new DungeonObject();
	 *
	 * // Add multiple objects at once
	 * dungeon.add(chest, coin);
	 * console.log(dungeon.contains(chest)); // true
	 * console.log(dungeon.contains(coin)); // true
	 *
	 * // Objects know their dungeon
	 * console.log(chest.dungeon === dungeon); // true
	 * ```
	 */
	add(...dobjs: DungeonObject[]) {
		for (let obj of dobjs) {
			if (this.contains(obj)) continue;
			this._contents.push(obj);
			if (obj.dungeon !== this) obj.dungeon = this;
		}
	}

	/**
	 * Remove objects from this dungeon's registry of contained objects.
	 * Also unsets the object's dungeon reference if it points to this dungeon.
	 *
	 * @param dobjs The objects to remove from this dungeon
	 *
	 * @example
	 * ```typescript
	 * const dungeon = Dungeon.generateEmptyDungeon({ dimensions: { width: 5, height: 5, layers: 1 } });
	 * const chest = new DungeonObject();
	 *
	 * // Add and then remove an object
	 * dungeon.add(chest);
	 * console.log(dungeon.contains(chest)); // true
	 * console.log(chest.dungeon === dungeon); // true
	 *
	 * dungeon.remove(chest);
	 * console.log(dungeon.contains(chest)); // false
	 * console.log(chest.dungeon === dungeon); // false
	 * ```
	 */
	remove(...dobjs: DungeonObject[]) {
		for (let obj of dobjs) {
			const index = this._contents.indexOf(obj);
			if (index === -1) continue;
			this._contents.splice(index, 1);
			if (obj.dungeon === this) obj.dungeon = undefined;
		}
	}

	/**
	 * Check whether this dungeon contains the given object.
	 *
	 * @param dobj The object to test for membership in this dungeon
	 * @returns true if the object is registered in this dungeon's contents
	 *
	 * @example
	 * ```typescript
	 * const dungeon = Dungeon.generateEmptyDungeon({ dimensions: { width: 3, height: 3, layers: 1 } });
	 * const room = dungeon.getRoom({ x: 0, y: 0, z: 0 });
	 * const chest = new DungeonObject({ keywords: "chest" });
	 * const coin = new DungeonObject({ keywords: "coin" });
	 *
	 * // Place chest in room (chest and room are added to dungeon.contents)
	 * room.add(chest);
	 * console.log(dungeon.contains(chest)); // true
	 *
	 * // Put coin in the chest (coin is also added to dungeon.contents via location updates)
	 * chest.add(coin);
	 * console.log(dungeon.contains(coin)); // true
	 *
	 * // Note: contains() only checks registered top-level membership
	 * // To verify 'coin' is inside 'chest', check chest.contains(coin)
	 * console.log(chest.contains(coin)); // true
	 * ```
	 */
	contains(dobj: DungeonObject) {
		return this._contents.indexOf(dobj) !== -1;
	}

	/**
	 * Initialize the internal 3D room grid structure.
	 *
	 * This creates a three-dimensional array sized according to `dimensions` and
	 * fills it with `undefined` placeholders. It does not allocate `Room`
	 * instances — that work is performed by `generateEmptyRooms()` (or you can
	 * allocate rooms yourself and assign them into the grid). Splitting
	 * allocation from instantiation allows faster, low-cost grid setup in cases
	 * where rooms are created lazily or populated from external data.

	 * @param dimensions The size of the grid to create (width, height, layers)
	 * @example
	 * ```typescript
	 * // Create an internal grid sized 10x10x2 but don't instantiate Room objects yet
	 * const dungeon = new Dungeon({ dimensions: { width: 10, height: 10, layers: 2 } });
	 * // The constructor calls generateGrid automatically; the grid currently holds undefined values
	 * console.log(dungeon.getRoom({ x: 0, y: 0, z: 0 })); // undefined until generateEmptyRooms() runs
	 * ```
	 */
	private generateGrid() {
		const rooms: (Room | undefined)[][][] = [];
		for (let z = 0; z < this._dimensions.layers; z++) {
			const layer: (Room | undefined)[][] = [];
			for (let y = 0; y < this._dimensions.height; y++) {
				const row: (Room | undefined)[] = [];
				for (let x = 0; x < this._dimensions.width; x++) {
					row.push(undefined);
				}
				layer.push(row);
			}
			rooms.push(layer);
		}
		this._rooms = rooms;
	}

	/**
	 * Instantiate `Room` objects for every slot in the internal grid.
	 *
	 * This walks the `_rooms` 3D array created by `generateGrid()` and replaces
	 * `undefined` placeholders with actual `Room` instances that are linked back
	 * to this dungeon. If the internal grid is not present, the method is a
	 * no-op. Use this to eagerly allocate every room in the dungeon.
	 *
	 * @example
	 * ```typescript
	 * // After generateGrid (done in constructor) the grid is empty; populate it now
	 * dungeon.generateRooms();
	 * const start = dungeon.getRoom({ x: 0, y: 0, z: 0 });
	 * console.log(start instanceof Room); // true
	 * ```
	 */
	generateRooms() {
		if (!this._rooms) return;
		for (let z = 0; z < this._dimensions.layers; z++)
			for (let y = 0; y < this._dimensions.height; y++)
				for (let x = 0; x < this._dimensions.width; x++)
					this.createRoom({ coordinates: { x, y, z } });
	}

	/**
	 * Adds an existing Room instance to the dungeon's room grid at the room's coordinates.
	 * The room must have valid coordinates that are within the dungeon's dimensions.
	 * If a room already exists at those coordinates, it will be replaced.
	 *
	 * Note: This method allows direct modification of the dungeon's room grid.
	 * Use with caution as it can create inconsistencies if not used properly.
	 *
	 * @param room The Room instance to add to the dungeon
	 * @returns true if the room was added to the dungeon
	 *
	 * @example
	 * ```typescript
	 * const room = new Room({ coordinates: { x: 0, y: 0, z: 0 } });
	 * const added = dungeon.addRoom(room);
	 * if (added) {
	 *   console.log('Room added successfully');
	 * }
	 * ```
	 */
	addRoom(room: Room): boolean {
		const { x, y, z } = room.coordinates;

		// Check if coordinates are within bounds
		if (
			x < 0 ||
			x >= this._dimensions.width ||
			y < 0 ||
			y >= this._dimensions.height ||
			z < 0 ||
			z >= this._dimensions.layers
		)
			return false;

		// Ensure the room grid exists
		if (!this._rooms) return false;

		this._rooms[z][y][x] = room;
		room.dungeon = this;
		return true;
	}

	/**
	 * Creates a new Room with the given options and adds it to the dungeon.
	 * The room will be placed in the dungeon's room grid according to its coordinates.
	 *
	 * @param options The options for creating the room, must include coordinates
	 * @returns The created room if successful, undefined if the coordinates are invalid
	 *
	 * @example
	 * ```typescript
	 * const room = dungeon.createRoom({
	 *   coordinates: { x: 0, y: 0, z: 0 },
	 *   keywords: "start room",
	 *   description: "You are in the starting room."
	 * });
	 *
	 * if (room) console.log('Room created and added successfully');
	 * ```
	 */
	createRoom(options: RoomOptions): Room | undefined {
		const room = new Room({ ...options, dungeon: this });
		if (this.addRoom(room)) return room;
	}

	/**
	 * Get the room at the specified coordinates.
	 * Returns undefined when the coordinates are outside the dungeon bounds.
	 *
	 * @param coordinates The coordinates object containing x/y/z positions
	 * @returns The Room at the coordinates or undefined if out of bounds
	 *
	 * @example
	 * ```typescript
	 * // Using a coordinates object
	 * const room1 = dungeon.getRoom({ x: 0, y: 0, z: 0 });
	 * if (!room1) throw new Error('No room at those coordinates');
	 * ```
	 */
	getRoom(coordinates: Coordinates): Room | undefined;

	/**
	 * Get the room at the specified coordinates.
	 * Returns undefined when the coordinates are outside the dungeon bounds.
	 *
	 * @param x The x-coordinate of the room
	 * @param y The y-coordinate of the room
	 * @param z The z-coordinate of the room
	 * @returns The Room at the coordinates or undefined if out of bounds
	 *
	 * @example
	 * ```typescript
	 * // Using xyz coordinates
	 * const room1 = dungeon.getRoom(0, 0, 0);
	 * if (!room1) throw new Error('No room at those coordinates');
	 * ```

	 * @param x 
	 * @param y 
	 * @param z 
	 */
	getRoom(x: number, y: number, z: number): Room | undefined;
	getRoom(
		coordsOrX: Coordinates | number,
		y?: number,
		z?: number
	): Room | undefined {
		let coords: Coordinates;

		if (
			typeof coordsOrX === "number" &&
			typeof y === "number" &&
			typeof z === "number"
		) {
			coords = { x: coordsOrX, y, z };
		} else if (typeof coordsOrX === "object") {
			coords = coordsOrX;
		} else {
			return undefined;
		}

		if (!this._rooms) return;
		if (coords.x < 0 || coords.x >= this._dimensions.width) return;
		if (coords.y < 0 || coords.y >= this._dimensions.height) return;
		if (coords.z < 0 || coords.z >= this._dimensions.layers) return;
		return this._rooms[coords.z][coords.y][coords.x];
	}

	/**
	 * Gets the room adjacent to a given position in the specified direction.
	 * This method handles both cardinal and diagonal movement by using bitwise
	 * direction flags. The input coordinates can be either explicit coordinates
	 * or a Room instance (in which case its coordinates are used).
	 *
	 * @param coordinates Starting position as either Coordinates or a Room instance
	 * @param direction The direction to move, can be a single direction or combination
	 * @returns The Room in the specified direction, or undefined if out of bounds
	 *
	 * @example
	 * ```typescript
	 * const dungeon = Dungeon.generateEmptyDungeon({
	 *   dimensions: { width: 3, height: 3, layers: 2 }
	 * });
	 * const start = dungeon.getRoom({ x: 1, y: 1, z: 0 });
	 *
	 * // Using explicit coordinates
	 * const northRoom = dungeon.getStep({ x: 1, y: 1, z: 0 }, DIRECTION.NORTH);
	 *
	 * // Using a room instance
	 * const eastRoom = dungeon.getStep(start, DIRECTION.EAST);
	 *
	 * // Diagonal movement
	 * const neRoom = dungeon.getStep(start, DIRECTION.NORTHEAST);
	 *
	 * // Vertical movement
	 * const upRoom = dungeon.getStep(start, DIRECTION.UP);
	 *
	 * // Returns undefined if moving out of bounds
	 * const invalid = dungeon.getStep(start, DIRECTION.WEST); // undefined if at x=0
	 * ```
	 */
	getStep(coordinates: Coordinates | Room, direction: DIRECTION) {
		if (coordinates instanceof Room) coordinates = coordinates.coordinates;
		if (direction & DIRECTION.NORTH) coordinates.y--;
		if (direction & DIRECTION.SOUTH) coordinates.y++;
		if (direction & DIRECTION.EAST) coordinates.x++;
		if (direction & DIRECTION.WEST) coordinates.x--;
		if (direction & DIRECTION.UP) coordinates.z++;
		if (direction & DIRECTION.DOWN) coordinates.z--;
		return this.getRoom(coordinates);
	}
}

export type DungeonObjectOptions = {
	keywords?: string;
	display?: string;
	description?: string;
	dungeon?: Dungeon;
};

/**
 * Base class for all objects that can exist in the dungeon.
 * Provides core functionality for object identification, containment, and location management.
 *
 * @example
 * ```typescript
 * // Create a basic object
 * const sword = new DungeonObject();
 * sword.keywords = "longsword sword";
 * sword.display = "A Sharp Longsword";
 * sword.description = "A well-crafted steel longsword.";
 *
 * // Add items to a container
 * const bag = new DungeonObject();
 * bag.add(sword); // sword is now inside bag
 *
 * // Check containment
 * console.log(bag.contains(sword)); // true
 * console.log(sword.location === bag); // true
 * ```
 */
export class DungeonObject {
	/**
	 * Space-separated list of words that can be used to identify this object.
	 * Used by the match() method for object identification and targeting.
	 */
	keywords: string = "dungeon object";

	/**
	 * Human-readable name for this object, shown in interfaces and output.
	 */
	display: string = "Dungeon Object";

	/**
	 * Detailed description of this object, shown when examining or looking.
	 * Can include multiple sentences and rich descriptive text about the
	 * object's appearance, state, and notable features.
	 */
	description: string = "It's an object.";

	/**
	 * Array of objects directly contained by this object. Acts as a container
	 * registry for inventory, room contents, or nested object hierarchies.
	 * @private
	 */
	private _contents: DungeonObject[] = [];

	/**
	 * Reference to the dungeon this object belongs to, if any.
	 * All objects in a containment tree share the same dungeon reference.
	 * @private
	 */
	private _dungeon?: Dungeon;

	/**
	 * Reference to the container holding this object, if any.
	 * Forms part of the object containment hierarchy along with _contents.
	 * @private
	 */
	private _location?: DungeonObject;

	/**
	 * Create a new DungeonObject.
	 *
	 * @param options Optional initialization values
	 * @param options.keywords Space-delimited keywords used by `match()`
	 * @param options.display Human-readable display string
	 * @param options.description Longer descriptive text
	 * @param options.dungeon If provided, the object will be added to that dungeon
	 *
	 * @example
	 * ```typescript
	 * const sword = new DungeonObject({ keywords: "steel sword", display: "A Sword" });
	 * const room = dungeon.getRoom({ x: 0, y: 0, z: 0 });
	 * sword.dungeon = dungeon; // adds sword to dungeon.contents
	 * ```
	 */
	constructor(options?: DungeonObjectOptions) {
		if (!options) return;
		if (options.dungeon) this.dungeon = options.dungeon;
		if (options.keywords) this.keywords = options.keywords;
		if (options.display) this.display = options.display;
		if (options.description) this.description = options.description;
	}

	/**
	 * Returns all objects directly contained by this object.
	 * The array it returns is a copy that can be safely transformed.
	 *
	 * @returns An array of DungeonObjects directly contained by this object
	 *
	 * @example
	 * ```typescript
	 * const bag = new DungeonObject();
	 * const coin = new DungeonObject({ keywords: "gold coin" });
	 * const gem = new DungeonObject({ keywords: "ruby gem" });
	 *
	 * bag.add(coin, gem);
	 * const items = bag.contents;
	 * console.log(items.length); // 2
	 * console.log(items.some(item => item.match("coin"))); // true
	 * ```
	 */
	get contents() {
		return [...this._contents];
	}

	/**
	 * Sets the container of this object and manages all related containment updates.
	 * When an object's location changes, it automatically:
	 * - Removes itself from its old container
	 * - Adds itself to the new container
	 * - Updates its dungeon reference to match its new container
	 *
	 * @param dobj The new container for this object, or undefined to remove from current container
	 *
	 * @example
	 * ```typescript
	 * const chest = new DungeonObject({ keywords: "wooden chest" });
	 * const sword = new DungeonObject({ keywords: "steel sword" });
	 * const room = dungeon.getRoom({ x: 0, y: 0, z: 0 });
	 *
	 * // Place chest in room
	 * chest.location = room;
	 * console.log(room.contains(chest)); // true
	 *
	 * // Put sword in chest
	 * sword.location = chest;
	 * console.log(chest.contains(sword)); // true
	 * console.log(dungeon.contains(sword)); // true (inherits dungeon from chest)
	 *
	 * // Remove from chest
	 * sword.location = undefined;
	 * console.log(chest.contains(sword)); // false
	 * ```
	 */
	set location(dobj: DungeonObject | undefined) {
		if (this._location === dobj) return;
		if (this._location) {
			const oldLocation: DungeonObject = this._location;
			this._location = undefined;
			oldLocation.remove(this);
		}

		this._location = dobj;
		if (dobj) {
			dobj.add(this);
			this.dungeon = dobj.dungeon;
		} else this.dungeon = undefined;
	}

	/**
	 * Sets the container (location) of this object.
	 * Assigning a new location will remove the object from its previous container
	 * and add it to the new container. Setting to `undefined` removes it from any container.
	 *
	 * @param dobj The container to place this object into, or `undefined` to remove
	 *
	 * @example
	 * ```typescript
	 * const chest = new DungeonObject({ keywords: "wooden chest" });
	 * const coin = new DungeonObject({ keywords: "gold coin" });
	 * chest.add(coin);
	 * // coin.location === chest;
	 * ```
	 */
	get location(): DungeonObject | undefined {
		return this._location;
	}

	/**
	 * Assign or remove this object's dungeon.
	 * When set, the object will be added to the dungeon's global contents and
	 * all contained objects will inherit the dungeon reference.
	 *
	 * @param dungeon The dungeon to assign, or `undefined` to remove
	 *
	 * @example
	 * ```typescript
	 * const dungeon = Dungeon.generateEmptyDungeon({ dimensions: { width: 5, height: 5, layers: 1 } });
	 * const room = dungeon.getRoom({coordinates: {x:0, y:0, z:0}});
	 * const item = new DungeonObject({ keywords: "gem" });
	 * item.move(room); // item is now tracked in dungeon.contents
	 * ```
	 */
	set dungeon(dungeon: Dungeon | undefined) {
		if (this.dungeon === dungeon) return;

		// unassign dungeon
		if (this.dungeon) {
			const oldDungeon: Dungeon = this.dungeon;
			this._dungeon = undefined;
			oldDungeon.remove(this);
		}

		// move off of old dungeon location
		if (this.location && this.location.dungeon !== dungeon)
			this.location = undefined;

		// update new dungeon
		this._dungeon = dungeon;
		if (dungeon) dungeon.add(this);

		// inform our contents that we're in a new dungeon
		for (let obj of this._contents) obj.dungeon = dungeon;
	}

	/**
	 * Get the dungeon this object belongs to, if any.
	 * @returns The Dungeon instance or undefined
	 *
	 * @example
	 * ```typescript
	 * const room = dungeon.getRoom({ x: 0, y: 0, z: 0 });
	 * const item = new DungeonObject();
	 * room.add(item);
	 * console.log(item.dungeon === dungeon); // true
	 * ```
	 */
	get dungeon() {
		return this._dungeon;
	}

	/**
	 * Check if the given keywords match this object's own keywords.

	 * @param keywords Space-delimited search terms
	 * @returns true if the search terms match this object's keywords
	 *
	 * @example
	 * ```typescript
	 * const sword = new DungeonObject({ keywords: "steel sword" });
	 * const bag = new DungeonObject({ keywords: "leather bag" });
	 * bag.add(sword);
	 *
	 * // Correct: match tests the object's own keywords
	 * console.log(sword.match("sword")); // true
	 *
	 * // To check contents, test each contained item
	 * console.log(bag.contents.some(item => item.match("sword"))); // true
	 * ```
	 */
	match(keywords: string): boolean {
		return string.matchKeywords(keywords, this.keywords);
	}

	/**
	 * Add objects to this container's contents.
	 * Also sets each object's location to this container. Objects already in this
	 * container are ignored. This method maintains containment consistency by
	 * ensuring both the contents array and location references are updated.
	 *
	 * @param dobjs The objects to add to this container
	 *
	 * @example
	 * ```typescript
	 * const chest = new DungeonObject({ keywords: "chest" });
	 * const coin = new DungeonObject({ keywords: "coin" });
	 * const gem = new DungeonObject({ keywords: "gem" });
	 *
	 * // Add multiple items at once
	 * chest.add(coin, gem);
	 *
	 * // Items are now in the chest
	 * console.log(chest.contains(coin)); // true
	 * console.log(coin.location === chest); // true
	 *
	 * // Adding an item that's already contained is ignored
	 * chest.add(coin); // no effect
	 * ```
	 */
	add(...dobjs: DungeonObject[]) {
		for (let obj of dobjs) {
			if (this.contains(obj)) continue;
			this._contents.push(obj);
			if (obj.location !== this) obj.move(this);
		}
	}

	/**
	 * Remove objects from this container's contents.
	 * Also unsets each object's location if it points to this container.
	 * Objects not found in the contents are ignored. This method maintains
	 * containment consistency by ensuring both the contents array and location
	 * references are updated.
	 *
	 * @param dobjs The objects to remove from this container
	 *
	 * @example
	 * ```typescript
	 * const chest = new DungeonObject({ keywords: "chest" });
	 * const coin = new DungeonObject({ keywords: "coin" });
	 *
	 * // Add and then remove an item
	 * chest.add(coin);
	 * console.log(chest.contains(coin)); // true
	 *
	 * chest.remove(coin);
	 * console.log(chest.contains(coin)); // false
	 * console.log(coin.location === undefined); // true
	 *
	 * // Removing an item that's not contained is ignored
	 * chest.remove(coin); // no effect
	 * ```
	 */
	remove(...dobjs: DungeonObject[]) {
		for (let obj of dobjs) {
			const index = this._contents.indexOf(obj);
			if (index === -1) continue;
			this._contents.splice(index, 1);
			if (obj.location === this) obj.move(undefined);
		}
	}

	/**
	 * Check if we directly contain the given object.
	 *
	 * This method tests whether the specified object is immediately present in
	 * this container's `contents` array. It does not perform a deep or recursive
	 * search. To check for nested containment (for example, whether the object
	 * exists anywhere inside this container's subtree), you can walk the
	 * containment graph manually or implement a helper that searches recursively.
	 *
	 * @param dobj The object to test for direct containment
	 * @returns true if `dobj` is directly contained by this object
	 *
	 * @example
	 * ```typescript
	 * const bag = new DungeonObject({ keywords: "bag" });
	 * const pouch = new DungeonObject({ keywords: "pouch" });
	 * const coin = new DungeonObject({ keywords: "coin" });
	 * bag.add(pouch);
	 * pouch.add(coin);
	 *
	 * console.log(bag.contains(pouch)); // true (direct)
	 * console.log(bag.contains(coin)); // false (coin is nested inside pouch)
	 * // To check nested containment:
	 * function containsRecursive(container: DungeonObject, target: DungeonObject): boolean {
	 *   if (container.contains(target)) return true;
	 *   for (const child of container.contents) {
	 *     if (containsRecursive(child, target)) return true;
	 *   }
	 *   return false;
	 * }
	 * console.log(containsRecursive(bag, coin)); // true
	 * ```
	 */
	contains(dobj: DungeonObject) {
		return this._contents.indexOf(dobj) !== -1;
	}

	/**
	 * Moves this object to a new container, triggering appropriate movement events.
	 * This is the preferred method for changing an object's location as it provides
	 * a hook for custom movement behavior in subclasses.
	 *
	 * @param dobj The new container for this object, or undefined to remove from current container
	 *
	 * @example
	 * ```typescript
	 * const creature = new DungeonObject();
	 * const room = dungeon.getRoom({ x: 0, y: 0, z: 0 });
	 * creature.move(room);
	 * ```
	 */
	move(dobj: DungeonObject | undefined) {
		this.location = dobj;
	}
}

/**
 * Represents a position in the three-dimensional dungeon space.
 * Used for room positioning and movement calculations.
 *
 * @property x - Position along the east-west axis (positive = east)
 * @property y - Position along the north-south axis (positive = south)
 * @property z - Position along the up-down axis (positive = up)
 *
 * @example
 * ```typescript
 * // Ground floor coordinates
 * const start: Coordinates = { x: 0, y: 0, z: 0 };
 *
 * // Second floor, northeast corner
 * const upstairs: Coordinates = { x: 9, y: 0, z: 1 };
 *
 * // Get room at coordinates
 * const room = dungeon.getRoom(coordinates);
 *
 * // Calculate new coordinates
 * const newCoords: Coordinates = {
 *   x: room.x + 1,  // One room east
 *   y: room.y,      // Same north-south position
 *   z: room.z + 1   // One level up
 * };
 * ```
 */
export type Coordinates = {
	x: number;
	y: number;
	z: number;
};

export type RoomOptions = {
	coordinates: Coordinates;
} & DungeonObjectOptions;

/**
 * Represents a single location within the dungeon.
 * Rooms are connected to adjacent rooms and can contain objects and characters.
 * Extends DungeonObject to inherit containment and identification features.
 *
 * @example
 * ```typescript
 * // Get a room from the dungeon
 * const room = dungeon.getRoom({ x: 1, y: 1, z: 0 });
 *
 * // Check adjacent rooms
 * const northRoom = room.getStep(DIRECTION.NORTH);
 * const southEastRoom = room.getStep(DIRECTION.SOUTHEAST);
 *
 * // Add objects to the room
 * const chest = new DungeonObject();
 * room.add(chest);
 *
 * // Custom movement rules
 * class LockedRoom extends Room {
 *   canEnter(movable: Movable, direction?: DIRECTION) {
 *     return movable.hasKey; // Custom logic
 *   }
 * }
 * ```
 *
 * Features:
 * - Three-dimensional positioning
 * - Adjacent room navigation
 * - Movement validation hooks
 * - Customizable entry/exit behavior
 * - Container functionality (inherited)
 */
export class Room extends DungeonObject {
	keywords = "room";
	display = "A Room";
	description = "It's a room.";

	/**
	 * The position of this room in the dungeon's coordinate system.
	 * Set during construction and immutable afterwards.
	 * @private
	 */
	private _coordinates: Coordinates;
	/**
	 * Returns a shallow copy of the room's coordinates.
	 * @returns The room coordinates as an object { x, y, z }
	 *
	 * @example
	 * ```typescript
	 * const room = dungeon.getRoom({ x: 1, y: 2, z: 0 });
	 * const coords = room.coordinates;
	 * console.log(coords.x, coords.y, coords.z);
	 * ```
	 */
	get coordinates(): Coordinates {
		return {
			x: this._coordinates.x,
			y: this._coordinates.y,
			z: this._coordinates.z,
		};
	}

	/**
	 * X coordinate (east-west) of this room.
	 * @returns number X coordinate
	 */
	get x() {
		return this._coordinates.x;
	}

	/**
	 * Y coordinate (north-south) of this room.
	 * @returns number Y coordinate
	 */
	get y() {
		return this._coordinates.y;
	}

	/**
	 * Z coordinate (vertical layer) of this room.
	 * @returns number Z coordinate
	 */
	get z() {
		return this._coordinates.z;
	}

	/**
	 * Create a new Room instance.
	 *
	 * @param options Room initialization options (coordinates required)
	 * @param options.coordinates The position of the room in the dungeon
	 * @param options.dungeon Optional dungeon reference; if provided the room will be added
	 *
	 * @example
	 * ```typescript
	 * const room = new Room({ coordinates: { x: 1, y: 1, z: 0 }, dungeon });
	 * ```
	 */
	constructor(options: RoomOptions) {
		super(options);
		this._coordinates = options.coordinates;
	}

	/**
	 * Gets the room adjacent to this room in the specified direction.
	 * Returns undefined if there is no room in that direction or if this room
	 * is not part of a dungeon.
	 *
	 * @param dir The direction to check for an adjacent room
	 * @returns The adjacent Room instance or undefined
	 *
	 * @example
	 * ```typescript
	 * const room = dungeon.getRoom({ x: 1, y: 1, z: 0 });
	 *
	 * // Check basic directions
	 * const northRoom = room.getStep(DIRECTION.NORTH);
	 * if (northRoom) {
	 *   console.log("There is a room to the north");
	 * }
	 *
	 * // Check diagonal movement
	 * const northeastRoom = room.getStep(DIRECTION.NORTHEAST);
	 * ```
	 */
	getStep(dir: DIRECTION) {
		return this.dungeon?.getStep(this, dir);
	}

	/**
	 * Determines if a movable object can enter this room from a specific direction.
	 * Override this method to implement custom entry restrictions.
	 *
	 * @param movable The object attempting to enter
	 * @param direction The direction from which the object is entering (opposite of movement direction)
	 * @returns true if entry is allowed, false otherwise
	 *
	 * @example
	 * ```typescript
	 * class KeyedRoom extends Room {
	 *   canEnter(movable: Movable, direction?: DIRECTION) {
	 *     return movable.contents.some(item => item.match("bronze key"));
	 *   }
	 * }
	 * ```
	 */
	canEnter(movable: Movable, direction?: DIRECTION) {
		return true;
	}

	/**
	 * Determines if a movable object can exit this room in a specific direction.
	 * Override this method to implement custom exit restrictions.
	 *
	 * @param movable The object attempting to exit
	 * @param direction The direction in which the object is trying to move
	 * @returns true if exit is allowed, false otherwise
	 *
	 * @example
	 * ```typescript
	 * class OneWayRoom extends Room {
	 *   canExit(movable: Movable, direction?: DIRECTION) {
	 *     // Only allow exit to the east
	 *     return direction === DIRECTION.EAST;
	 *   }
	 * }
	 * ```
	 */
	canExit(movable: Movable, direction?: DIRECTION) {
		return true;
	}

	/**
	 * Hook called when a movable object enters this room.
	 * Override this method to implement custom entry behavior.
	 *
	 * @param movable The object that entered the room
	 * @param direction The direction from which the object entered (opposite of movement direction)
	 *
	 * @example
	 * ```typescript
	 * class TrapRoom extends Room {
	 *   onEnter(movable: Movable, direction?: DIRECTION) {
	 *     console.log("The floor gives way beneath you!");
	 *     const pitRoom = this.getStep(DIRECTION.DOWN);
	 *     if (pitRoom) movable.move(pitRoom);
	 *   }
	 * }
	 * ```
	 */
	onEnter(movable: Movable, direction?: DIRECTION) {}

	/**
	 * Hook called when a movable object exits this room.
	 * Override this method to implement custom exit behavior.
	 *
	 * @param movable The object that exited the room
	 * @param direction The direction in which the object moved
	 *
	 * @example
	 * ```typescript
	 * class AlarmRoom extends Room {
	 *   onExit(movable: Movable, direction?: DIRECTION) {
	 *     if (!hasSneak) {
	 *       console.log("An alarm sounds as you leave!");
	 *       this.contents.forEach(obj => {
	 *         if (obj instanceof Guard) {
	 *           obj.pursue(movable);
	 *         }
	 *       });
	 *     }
	 *   }
	 * }
	 * ```
	 */
	onExit(movable: Movable, direction?: DIRECTION) {}
}

/**
 * Represents objects that can move between rooms in the dungeon.
 * Extends DungeonObject with movement capabilities and position tracking.
 * Typically used for characters, NPCs, or any object that needs to move.
 *
 * @example
 * ```typescript
 * // Create a movable character
 * const player = new Movable();
 * player.keywords = "player hero";
 *
 * // Place in starting room
 * const startRoom = dungeon.getRoom({ x: 0, y: 0, z: 0 });
 * startRoom.add(player);
 *
 * // Move to adjacent room
 * if (player.canStep(DIRECTION.NORTH)) {
 *   player.step(DIRECTION.NORTH);
 * }
 *
 * // Get current position
 * console.log(player.coordinates); // { x: 0, y: -1, z: 0 }
 * ```
 *
 * Features:
 * - Room-to-room movement
 * - Position tracking
 * - Movement validation
 * - Coordinate caching
 * - Automatic position updates
 * - Movement event hooks (through Room)
 */
export class Movable extends DungeonObject {
	/**
	 * Cache of the current room coordinates where this object resides.
	 * This is synchronized with the containing room's coordinates when the
	 * object moves between rooms, and cleared when not in a room.
	 * Caching coordinates improves performance by avoiding frequent room lookups
	 * during movement and position checks.
	 * @private
	 */
	private _coordinates: Coordinates | undefined;

	/**
	 * Set the location (container) of this movable object.
	 * Also caches the room coordinates when the object is placed in a `Room`.
	 *
	 * @param dobj The container to move into, or undefined to remove from any container
	 *
	 * @example
	 * ```typescript
	 * const player = new Movable();
	 * const room = dungeon.getRoom({ x: 0, y: 0, z: 0 });
	 * player.location = room; // player now in room and coordinates cached
	 * player.location = undefined; // player removed from room
	 * ```
	 */
	set location(dobj: DungeonObject | undefined) {
		super.location = dobj;
		if (this.location instanceof Room)
			this._coordinates = this.location.coordinates;
		else if (this._coordinates) this._coordinates = undefined;
	}

	/**
	 * Get the current container/location of this movable object.
	 * @returns The DungeonObject containing this object, or undefined
	 */
	get location() {
		return super.location;
	}

	/**
	 * Gets the current coordinates of this movable object in the dungeon.
	 * Returns undefined if the object is not currently in a room.
	 *
	 * @returns The object's current position or undefined
	 *
	 * @example
	 * ```typescript
	 * const player = new Movable();
	 * console.log(player.coordinates); // undefined
	 *
	 * const room = dungeon.getRoom({ x: 5, y: 3, z: 1 });
	 * room.add(player);
	 *
	 * const pos = player.coordinates;
	 * console.log(pos); // { x: 5, y: 3, z: 1 }
	 * ```
	 */
	get coordinates(): Coordinates | undefined {
		if (!this._coordinates) return;
		return {
			x: this._coordinates.x,
			y: this._coordinates.y,
			z: this._coordinates.z,
		};
	}

	/**
	 * Gets the X coordinate (east-west position) of this movable object.
	 * Returns undefined if the object is not in a room.
	 *
	 * @returns The object's X coordinate or undefined
	 *
	 * @example
	 * ```typescript
	 * const player = new Movable();
	 * const room = dungeon.getRoom({ x: 5, y: 0, z: 0 });
	 * room.add(player);
	 *
	 * console.log(player.x); // 5
	 * console.log(player.x === room.x); // true
	 * ```
	 */
	get x() {
		return this._coordinates?.x;
	}

	/**
	 * Gets the Y coordinate (north-south position) of this movable object.
	 * Returns undefined if the object is not in a room.
	 *
	 * @returns The object's Y coordinate or undefined
	 *
	 * @example
	 * ```typescript
	 * const player = new Movable();
	 * const room = dungeon.getRoom({ x: 0, y: 3, z: 0 });
	 * room.add(player);
	 *
	 * console.log(player.y); // 3
	 * player.step(DIRECTION.NORTH);
	 * console.log(player.y); // 2
	 * ```
	 */
	get y() {
		return this._coordinates?.y;
	}

	/**
	 * Gets the Z coordinate (vertical level) of this movable object.
	 * Returns undefined if the object is not in a room.
	 *
	 * @returns The object's Z coordinate or undefined
	 *
	 * @example
	 * ```typescript
	 * const player = new Movable();
	 * const groundFloor = dungeon.getRoom({ x: 0, y: 0, z: 0 });
	 * groundFloor.add(player);
	 *
	 * console.log(player.z); // 0
	 * if (player.canStep(DIRECTION.UP)) {
	 *   player.step(DIRECTION.UP);
	 *   console.log(player.z); // 1
	 * }
	 * ```
	 */
	get z() {
		return this._coordinates?.z;
	}

	/**
	 * Gets the room adjacent to this movable object's current position in the specified direction.
	 * Returns undefined if the object is not in a room or if there is no room in that direction.
	 *
	 * @param dir The direction to check
	 * @returns The adjacent room or undefined
	 *
	 * @example
	 * ```typescript
	 * const player = new Movable();
	 * const room = dungeon.getRoom({ x: 1, y: 1, z: 0 });
	 * room.add(player);
	 *
	 * const northRoom = player.getStep(DIRECTION.NORTH);
	 * if (northRoom) {
	 *   console.log("There's a room to the north");
	 * }
	 *
	 * // Check diagonal movement
	 * const neRoom = player.getStep(DIRECTION.NORTHEAST);
	 * console.log(neRoom === room.getStep(DIRECTION.NORTHEAST)); // true
	 * ```
	 */
	getStep(dir: DIRECTION) {
		if (!this.coordinates) return;
		return this.dungeon?.getStep(this.coordinates, dir);
	}

	/**
	 * Checks if this object can move in the specified direction.
	 * Movement is allowed only if:
	 * - The object is in a room
	 * - There is a room in the target direction
	 * - The current room allows exit in that direction
	 * - The target room allows entry from that direction
	 *
	 * @param dir The direction to check
	 * @returns true if movement is allowed, false otherwise
	 *
	 * @example
	 * ```typescript
	 * const player = new Movable();
	 * const startRoom = dungeon.getRoom({ x: 0, y: 0, z: 0 });
	 * startRoom.add(player);
	 *
	 * // Check before moving
	 * if (player.canStep(DIRECTION.EAST)) {
	 *   console.log("You can move east");
	 * } else {
	 *   console.log("You can't go that way");
	 * }
	 *
	 * // Check combined directions
	 * if (player.canStep(DIRECTION.NORTHEAST)) {
	 *   console.log("You can move northeast");
	 * }
	 * ```
	 */
	canStep(dir: DIRECTION) {
		const exit = this.getStep(dir);
		if (!exit) return false;
		if (!(this.location instanceof Room)) return false;
		if (!this.location.canExit(this, dir)) return;
		if (!exit.canEnter(this, dir2reverse(dir))) return false;
		return true;
	}

	/**
	 * Moves this object one room in the specified direction.
	 * The move only occurs if canStep() returns true for that direction.
	 * Triggers appropriate exit/enter events on both rooms.
	 *
	 * @param dir The direction to move
	 * @returns true if the move was successful, false otherwise
	 *
	 * @example
	 * ```typescript
	 * const player = new Movable();
	 * player.keywords = "player adventurer";
	 * const startRoom = dungeon.getRoom({ x: 1, y: 1, z: 0 });
	 * startRoom.add(player);
	 *
	 * // Basic movement
	 * if (player.step(DIRECTION.NORTH)) {
	 *   console.log("Moved north successfully");
	 * }
	 *
	 * // Complex movement with room events
	 * class GuardedRoom extends Room {
	 *   onEnter(movable: Movable) {
	 *     console.log("A guard watches you enter...");
	 *   }
	 *   onExit(movable: Movable) {
	 *     console.log("The guard nods as you leave.");
	 *   }
	 * }
	 * ```
	 */
	step(dir: DIRECTION) {
		if (!this.canStep(dir)) return false;
		const exit = this.getStep(dir);
		if (!exit) return;
		if (this.location instanceof Room) this.location.onExit(this, dir);
		this.move(exit);
		if (this.location instanceof Room)
			this.location.onEnter(this, dir2reverse(dir));
	}
}
