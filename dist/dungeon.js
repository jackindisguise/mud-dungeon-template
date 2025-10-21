/**
 * enum for handling directions
 */
export var DIRECTION;
(function (DIRECTION) {
    DIRECTION[DIRECTION["NORTH"] = 1] = "NORTH";
    DIRECTION[DIRECTION["SOUTH"] = 2] = "SOUTH";
    DIRECTION[DIRECTION["EAST"] = 4] = "EAST";
    DIRECTION[DIRECTION["WEST"] = 8] = "WEST";
    DIRECTION[DIRECTION["UP"] = 16] = "UP";
    DIRECTION[DIRECTION["DOWN"] = 32] = "DOWN";
    DIRECTION[DIRECTION["NORTHEAST"] = 5] = "NORTHEAST";
    DIRECTION[DIRECTION["NORTHWEST"] = 9] = "NORTHWEST";
    DIRECTION[DIRECTION["SOUTHEAST"] = 6] = "SOUTHEAST";
    DIRECTION[DIRECTION["SOUTHWEST"] = 10] = "SOUTHWEST";
})(DIRECTION || (DIRECTION = {}));
/** A map from a direction (including combinations) to its opposite direction. */
export const DIR2REVERSE = new Map([
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
export function reverseDirection(dir) {
    return DIR2REVERSE.get(dir);
}
/** Turns a direction into text. */
export const DIR2TEXT = new Map([
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
export class Dungeon {
    _rooms = [];
    _contents = [];
    _dimensions;
    constructor(options) {
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
    add(...dobjs) {
        for (let obj of dobjs) {
            if (this.contains(obj))
                continue;
            this._contents.push(obj);
            if (obj.dungeon !== this)
                obj.dungeon = this;
        }
    }
    /**
     * Remove objects from our contents.
     * Recursively unset the object's dungeons.
     * @param dobjs
     */
    remove(...dobjs) {
        for (let obj of dobjs) {
            const index = this._contents.indexOf(obj);
            if (index === -1)
                continue;
            this._contents.splice(index, 1);
            if (obj.dungeon === this)
                obj.dungeon = undefined;
        }
    }
    contains(dobj) {
        return this._contents.indexOf(dobj) !== -1;
    }
    /**
     * Generate a 3-dimensional array of Rooms.
     * @param width
     * @param height
     * @param layers
     */
    generateRooms(dimensions) {
        const rooms = [];
        for (let z = 0; z < dimensions.layers; z++) {
            const layer = [];
            for (let y = 0; y < dimensions.height; y++) {
                const row = [];
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
    getRoom(coordinates) {
        if (coordinates.x < 0 || coordinates.x >= this._dimensions.width)
            return;
        if (coordinates.y < 0 || coordinates.y >= this._dimensions.height)
            return;
        if (coordinates.z < 0 || coordinates.z >= this._dimensions.layers)
            return;
        return this._rooms[coordinates.z][coordinates.y][coordinates.x];
    }
    getStep(coordinates, direction) {
        if (direction & DIRECTION.NORTH)
            coordinates.y--;
        if (direction & DIRECTION.SOUTH)
            coordinates.y++;
        if (direction & DIRECTION.EAST)
            coordinates.x++;
        if (direction & DIRECTION.WEST)
            coordinates.x--;
        if (direction & DIRECTION.UP)
            coordinates.z++;
        if (direction & DIRECTION.DOWN)
            coordinates.z--;
        return this.getRoom(coordinates);
    }
}
export class DungeonObject {
    /** Keywords for referring to this object. */
    keywords = "dungeon object";
    /** The display string for this object. */
    display = "Dungeon Object";
    /** A description of this object. */
    description = "It's an object.";
    /** Dungeon objects that we are holding. */
    _contents = [];
    /** The Dungeon we are in. */
    _dungeon;
    /** Dungeon Objects occupy other Dungeon Objects. */
    _location;
    constructor(options) {
        if (!options)
            return;
        if (options.dungeon)
            this.dungeon = options.dungeon;
    }
    /** A safe, shallow copy of my contents. */
    get contents() {
        return [...this._contents];
    }
    /** Set location and recursively add us to the target's contents. */
    set location(dobj) {
        if (this._location === dobj)
            return;
        if (this._location) {
            const oldLocation = this._location;
            this._location = undefined;
            oldLocation.remove(this);
        }
        this._location = dobj;
        if (dobj) {
            dobj.add(this);
            this.dungeon = dobj.dungeon;
        }
        else
            this.dungeon = undefined;
    }
    get location() {
        return this._location;
    }
    set dungeon(dungeon) {
        if (this.dungeon === dungeon)
            return;
        // unassign dungeon
        if (this.dungeon) {
            const oldDungeon = this.dungeon;
            this._dungeon = undefined;
            oldDungeon.remove(this);
        }
        // move off of old dungeon location
        if (this.location && this.location.dungeon !== dungeon)
            this.location = undefined;
        // update new dungeon
        this._dungeon = dungeon;
        if (dungeon)
            dungeon.add(this);
        // inform our contents that we're in a new dungeon
        for (let obj of this._contents)
            obj.dungeon = dungeon;
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
    add(...dobjs) {
        for (let obj of dobjs) {
            if (this.contains(obj))
                continue;
            this._contents.push(obj);
            if (obj.location !== this)
                obj.move(this);
        }
    }
    /**
     * Remove objects from our contents.
     * Recursively unset the object's location.
     * @param dobjs
     */
    remove(...dobjs) {
        for (let obj of dobjs) {
            const index = this._contents.indexOf(obj);
            if (index === -1)
                continue;
            this._contents.splice(index, 1);
            if (obj.location === this)
                obj.move(undefined);
        }
    }
    /**
     * Check if we contain this object.
     * @param dobj
     * @returns
     */
    contains(dobj) {
        return this._contents.indexOf(dobj) !== -1;
    }
    /**
     * This will trigger events or something.
     * It's better than directly setting location.
     * @param dobj
     */
    move(dobj) {
        this.location = dobj;
    }
}
export class Room extends DungeonObject {
    keywords = "room";
    display = "A Room";
    description = "It's a room.";
    _coordinates;
    get coordinates() {
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
    constructor(options) {
        super(options);
        this._coordinates = options.coordinates;
    }
    getStep(dir) {
        return this.dungeon?.getStep(this.coordinates, dir);
    }
    canEnter(movable, direction) {
        return true;
    }
    canExit(movable, direction) {
        return true;
    }
    onEnter(movable, direction) { }
    onExit(movable, direction) { }
}
export class Movable extends DungeonObject {
    /** Ultimately an alias for the coordinates of the room we're in (if we're in one). */
    _coordinates;
    /**
     * Does all the recursive work of setting a location.
     * Also caches a copy of our Room's coordinates (if we're in a room).
     */
    set location(dobj) {
        super.location = dobj;
        if (this.location instanceof Room)
            this._coordinates = this.location.coordinates;
        else if (this._coordinates)
            this._coordinates = undefined;
    }
    get location() {
        return super.location;
    }
    get coordinates() {
        if (!this._coordinates)
            return;
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
    getStep(dir) {
        if (!this.coordinates)
            return;
        return this.dungeon?.getStep(this.coordinates, dir);
    }
    canStep(dir) {
        const exit = this.getStep(dir);
        if (!exit)
            return false;
        if (!(this.location instanceof Room))
            return false;
        if (!this.location.canExit(this, dir))
            return;
        if (!exit.canEnter(this, reverseDirection(dir)))
            return false;
        return true;
    }
    step(dir) {
        if (!this.canStep(dir))
            return false;
        const exit = this.getStep(dir);
        if (!exit)
            return;
        if (this.location instanceof Room)
            this.location.onExit(this, dir);
        this.move(exit);
        if (this.location instanceof Room)
            this.location.onEnter(this, reverseDirection(dir));
    }
}
