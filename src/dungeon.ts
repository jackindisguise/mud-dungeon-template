/**
 * enum for handling directions
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

/** A map from a direction (including combinations) to its opposite direction. */
export const DIR2REVERSE = new Map<DIRECTION, DIRECTION>([
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

export function reverseDirection(dir: DIRECTION) {
	return DIR2REVERSE.get(dir);
}

/** Turns a direction into text. */
export const DIR2TEXT = new Map<DIRECTION, string>([
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

export type MapDimensions = {
	width: number;
	height: number;
	layers: number;
};

export type DungeonOptions = {
	dimensions: MapDimensions;
};

export class Dungeon {
	private _rooms: Room[][][] = [];
	private _contents: DungeonObject[] = [];
	private _dimensions: MapDimensions;

	constructor(options: DungeonOptions) {
		this._dimensions = options.dimensions;
		this.generateRooms(options.dimensions);
	}

	/** A safe, shallow copy of our contents. */
	get contents() {
		return [...this._contents];
	}

	/**
	 * Add objects to our contents.
	 * Recursively set the object's dungeon.
	 * @param dobjs
	 * @returns
	 */
	add(...dobjs: DungeonObject[]) {
		for (let obj of dobjs) {
			if (this.contains(obj)) continue;
			this._contents.push(obj);
			if (obj.dungeon !== this) obj.dungeon = this;
		}
	}

	/**
	 * Remove objects from our contents.
	 * Recursively unset the object's dungeons.
	 * @param dobjs
	 */
	remove(...dobjs: DungeonObject[]) {
		for (let obj of dobjs) {
			const index = this._contents.indexOf(obj);
			if (index === -1) continue;
			this._contents.splice(index, 1);
			if (obj.dungeon === this) obj.dungeon = undefined;
		}
	}

	contains(dobj: DungeonObject) {
		return this._contents.indexOf(dobj) !== -1;
	}

	/**
	 * Generate a 3-dimensional array of Rooms.
	 * @param width
	 * @param height
	 * @param layers
	 */
	generateRooms(dimensions: MapDimensions) {
		const rooms: Room[][][] = [];
		for (let z = 0; z < dimensions.layers; z++) {
			const layer: Room[][] = [];
			for (let y = 0; y < dimensions.height; y++) {
				const row: Room[] = [];
				for (let x = 0; x < dimensions.width; x++) {
					const room = new Room({ dungeon: this, coordinates: { x, y, z } });
					row.push(room);
				}
				layer.push(row);
			}
			rooms.push(layer);
		}
		this._rooms = rooms;
	}

	getRoom(coordinates: Coordinates) {
		if (coordinates.x < 0 || coordinates.x >= this._dimensions.width) return;
		if (coordinates.y < 0 || coordinates.y >= this._dimensions.height) return;
		if (coordinates.z < 0 || coordinates.z >= this._dimensions.layers) return;
		return this._rooms[coordinates.z][coordinates.y][coordinates.x];
	}

	getStep(coordinates: Coordinates, direction: DIRECTION) {
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
	dungeon?: Dungeon;
};

export class DungeonObject {
	/** Keywords for referring to this object. */
	keywords: string = "dungeon object";

	/** The display string for this object. */
	display: string = "Dungeon Object";

	/** A description of this object. */
	description: string = "It's an object.";

	/** Dungeon objects that we are holding. */
	private _contents: DungeonObject[] = [];

	/** The Dungeon we are in. */
	private _dungeon?: Dungeon;

	/** Dungeon Objects occupy other Dungeon Objects. */
	private _location?: DungeonObject;

	constructor(options?: DungeonObjectOptions) {
		if (!options) return;
		if (options.dungeon) this.dungeon = options.dungeon;
	}

	/** A safe, shallow copy of my contents. */
	get contents() {
		return [...this._contents];
	}

	/** Set location and recursively add us to the target's contents. */
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

	get location(): DungeonObject | undefined {
		return this._location;
	}

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

	get dungeon() {
		return this._dungeon;
	}

	/**
	 * Add objects to our contents.
	 * Recursively set the object's location.
	 * @param dobjs
	 * @returns
	 */
	add(...dobjs: DungeonObject[]) {
		for (let obj of dobjs) {
			if (this.contains(obj)) continue;
			this._contents.push(obj);
			if (obj.location !== this) obj.move(this);
		}
	}

	/**
	 * Remove objects from our contents.
	 * Recursively unset the object's location.
	 * @param dobjs
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
	 * Check if we contain this object.
	 * @param dobj
	 * @returns
	 */
	contains(dobj: DungeonObject) {
		return this._contents.indexOf(dobj) !== -1;
	}

	/**
	 * This will trigger events or something.
	 * It's better than directly setting location.
	 * @param dobj
	 */
	move(dobj: DungeonObject | undefined) {
		this.location = dobj;
	}
}

export type Coordinates = {
	x: number;
	y: number;
	z: number;
};

export type RoomOptions = DungeonObjectOptions & {
	coordinates: Coordinates;
};

export class Room extends DungeonObject {
	keywords = "room";
	display = "A Room";
	description = "It's a room.";
	private _coordinates: Coordinates;
	get coordinates(): Coordinates {
		return {
			x: this._coordinates.x,
			y: this._coordinates.y,
			z: this._coordinates.z,
		};
	}

	get x() {
		return this._coordinates.x;
	}

	get y() {
		return this._coordinates.y;
	}

	get z() {
		return this._coordinates.z;
	}

	constructor(options: RoomOptions) {
		super(options);
		this._coordinates = options.coordinates;
	}

	getStep(dir: DIRECTION) {
		return this.dungeon?.getStep(this.coordinates, dir);
	}

	canEnter(movable: Movable, direction?: DIRECTION) {
		return true;
	}

	canExit(movable: Movable, direction?: DIRECTION) {
		return true;
	}

	onEnter(movable: Movable, direction?: DIRECTION) {}

	onExit(movable: Movable, direction?: DIRECTION) {}
}

export class Movable extends DungeonObject {
	/** Ultimately an alias for the coordinates of the room we're in (if we're in one). */
	private _coordinates: Coordinates | undefined;

	/**
	 * Does all the recursive work of setting a location.
	 * Also caches a copy of our Room's coordinates (if we're in a room).
	 */
	set location(dobj: DungeonObject | undefined) {
		super.location = dobj;
		if (this.location instanceof Room)
			this._coordinates = this.location.coordinates;
		else if (this._coordinates) this._coordinates = undefined;
	}

	get location() {
		return super.location;
	}

	get coordinates(): Coordinates | undefined {
		if (!this._coordinates) return;
		return {
			x: this._coordinates.x,
			y: this._coordinates.y,
			z: this._coordinates.z,
		};
	}

	get x() {
		return this._coordinates?.x;
	}

	get y() {
		return this._coordinates?.y;
	}

	get z() {
		return this._coordinates?.z;
	}

	getStep(dir: DIRECTION) {
		if (!this.coordinates) return;
		return this.dungeon?.getStep(this.coordinates, dir);
	}

	canStep(dir: DIRECTION) {
		const exit = this.getStep(dir);
		if (!exit) return false;
		if (!(this.location instanceof Room)) return false;
		if (!this.location.canExit(this, dir)) return;
		if (!exit.canEnter(this, reverseDirection(dir))) return false;
		return true;
	}

	step(dir: DIRECTION) {
		if (!this.canStep(dir)) return false;
		const exit = this.getStep(dir);
		if (!exit) return;
		if (this.location instanceof Room) this.location.onExit(this, dir);
		this.move(exit);
		if (this.location instanceof Room)
			this.location.onEnter(this, reverseDirection(dir));
	}
}
