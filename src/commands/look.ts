import { Command, CommandContext } from "../command.js";
import { DIRECTION, DIRECTIONS, dir2text, Mob } from "../dungeon.js";

/**
 * Look command - Examine your surroundings or look in a specific direction.
 *
 * Usage:
 * - "look" - Examine the current room and see what's here
 * - "look <direction>" - Look in a specific direction to see what's there
 *
 * Examples:
 * - "look" - Shows room description, exits, items, and other mobs
 * - "look north" - Shows what's to the north
 * - "look n" - Same as above (accepts abbreviations)
 */
export class LookCommand extends Command {
	pattern = "look <dir:direction?>";
	aliases = ["l <dir:direction?>"];

	execute(context: CommandContext, args: Map<string, any>): void {
		const direction = args.get("dir") as DIRECTION | undefined;

		if (direction !== undefined) {
			this.lookDirection(context, direction);
		} else {
			this.lookRoom(context);
		}
	}

	/**
	 * Display information about the current room.
	 */
	private lookRoom(context: CommandContext): void {
		if (!context.room) {
			console.log("You are not in a room.");
			return;
		}

		const room = context.room;

		// Room title and description
		console.log(`\n${room.display}`);
		console.log(room.description);

		// Show exits
		const exits = this.getExits(context);
		if (exits.length > 0) {
			console.log(`\nExits: [${exits.join(" ")}]`);
		} else {
			console.log("\nThere are no obvious exits.");
		}

		// Show items and objects in the room (excluding mobs)
		const objects = room.contents.filter(
			(obj) => obj !== context.actor && !(obj instanceof Mob)
		);
		if (objects.length > 0) {
			console.log("\nYou see:");
			for (const obj of objects) {
				console.log(`  ${obj.display}`);
			}
		}

		// Show other mobs in the room
		const mobs = room.contents.filter(
			(obj) => obj !== context.actor && obj instanceof Mob
		);
		if (mobs.length > 0) {
			console.log("\nAlso here:");
			for (const mob of mobs) {
				console.log(`  ${mob.display}`);
			}
		}
	}

	/**
	 * Look in a specific direction.
	 */
	private lookDirection(context: CommandContext, direction: number): void {
		if (!context.room) {
			console.log("You are not in a room.");
			return;
		}

		const directionName = dir2text(direction);
		const targetRoom = context.room.dungeon?.getStep(
			context.room.coordinates,
			direction
		);

		if (!targetRoom) {
			console.log(
				`You look ${directionName} but see nothing but an impassable barrier.`
			);
			return;
		}

		console.log(`\nYou look ${directionName}...`);
		console.log(`${targetRoom.display}`);
		console.log(targetRoom.description);
	}

	/**
	 * Get list of available exits from the current room.
	 */
	private getExits(context: CommandContext): string[] {
		if (!context.room || !context.room.dungeon) return [];

		const exits: string[] = [];
		for (const dir of DIRECTIONS) {
			const targetRoom = context.room.getStep(dir);
			if (targetRoom) {
				const dirText = dir2text(dir, true);
				exits.push(dirText);
			}
		}

		return exits;
	}

	onError(context: CommandContext, result: any): void {
		console.log("Usage: look [direction]");
		console.log("Examples:");
		console.log("  look - Examine your surroundings");
		console.log("  look north - Look to the north");
		console.log("  l n - Same as above (abbreviated)");
	}
}
