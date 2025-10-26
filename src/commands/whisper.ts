import { Command, CommandContext, ParseResult } from "../command.js";
import { Mob } from "../dungeon.js";

/**
 * Whisper command - Send a private message to another mob in the same room.
 *
 * Usage:
 * - "whisper <target> <message>" - Whisper a message to a specific mob
 *
 * Examples:
 * - "whisper guard meet me outside" - Whispers to the guard
 * - "whisper alice I have the key" - Whispers to alice
 *
 * Only the target mob will see the whispered message. Other mobs in the room
 * may see that you whispered something, but not the content.
 */
export class WhisperCommand extends Command {
	pattern = "whisper <target:mob> <message:text>";
	aliases = ["w <target:mob> <message:text>"];

	execute(context: CommandContext, args: Map<string, any>): void {
		const target = args.get("target") as Mob;
		const message = args.get("message") as string;

		if (!context.room) {
			console.log("You are not in a room.");
			return;
		}

		// Check if target is in the same room
		if (target.location !== context.room) {
			console.log(`${target.display} is not here.`);
			return;
		}

		// Don't whisper to yourself
		if (target === context.actor) {
			console.log("You can't whisper to yourself.");
			return;
		}

		// Send the whisper
		this.sendWhisper(context, target, message);
	}

	/**
	 * Send the whisper message to the target and provide feedback.
	 */
	private sendWhisper(
		context: CommandContext,
		target: Mob,
		message: string
	): void {
		// Message to the whisperer
		console.log(`You whisper to ${target.display}: ${message}`);

		// Message to the target (in a real implementation, this would be sent to the target's client)
		// For demonstration purposes, we'll just log it
		console.log(
			`[To ${target.display}] ${context.actor.display} whispers to you: ${message}`
		);

		// Optional: Message to others in the room (they see the action but not the content)
		if (context.room) {
			const others = context.room.contents.filter(
				(obj) => obj instanceof Mob && obj !== context.actor && obj !== target
			);

			if (others.length > 0) {
				console.log(
					`[To others] ${context.actor.display} whispers something to ${target.display}.`
				);
			}
		}
	}

	onError(context: CommandContext, result: ParseResult): void {
		const args = result.args as Map<string, any>;
		const target = args.get("target");
		const message = args.get("message");

		if (!target) {
			console.log("Who do you want to whisper to?");
		} else if (!message) {
			console.log("What do you want to whisper?");
		} else {
			console.log("Usage: whisper <target> <message>");
		}
	}
}
