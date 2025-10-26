import { DungeonObject, Mob, Item, Room, DIRECTION } from "./dungeon.js";

/**
 * Context provided to command execution.
 *
 * This interface encapsulates all the necessary context information needed for
 * a command to execute. It provides access to the actor performing the command,
 * their current location (if any), and the raw input string that triggered the command.
 *
 * @property actor - The Mob entity executing the command (typically a player or NPC)
 * @property room - The current room where the actor is located (undefined if not in a room)
 * @property input - The original unprocessed input string that triggered this command
 *
 * @example
 * ```typescript
 * const context: CommandContext = {
 *   actor: player,
 *   room: currentRoom,
 *   input: "get sword from chest"
 * };
 * ```
 */
export interface CommandContext {
	actor: Mob;
	room?: Room;
	input: string;
}

/**
 * Result of parsing a command pattern against user input.
 *
 * This interface represents the outcome of attempting to parse user input
 * against a command's pattern. A successful parse produces a map of argument
 * names to their parsed values. A failed parse includes an error message
 * explaining why the input didn't match.
 *
 * @property success - True if the input successfully matched the pattern and all required arguments were parsed
 * @property args - Map of argument names to their parsed values (empty if parsing failed)
 * @property error - Optional error message explaining why parsing failed (only present when success is false)
 *
 * @example
 * Successful parse:
 * ```typescript
 * {
 *   success: true,
 *   args: Map { "message" => "Hello, world!" },
 *   error: undefined
 * }
 * ```
 *
 * @example
 * Failed parse (missing argument):
 * ```typescript
 * {
 *   success: false,
 *   args: Map {},
 *   error: "Missing required argument: message"
 * }
 * ```
 */
export interface ParseResult {
	success: boolean;
	args: Map<string, any>;
	error?: string;
}

/**
 * Supported argument types for command patterns.
 *
 * This enum defines all the valid argument types that can be used in command
 * patterns. Each type has specific parsing logic and validation rules.
 *
 * @property TEXT - Captures all remaining input text (greedy match). Use for
 *                  messages, descriptions, or any freeform text. Always last argument.
 *
 * @property WORD - Captures a single word (non-whitespace). Use for single-word
 *                  arguments like names, identifiers, or keywords.
 *
 * @property NUMBER - Parses and validates as an integer. Returns undefined if
 *                    input is not a valid number. Use for quantities, IDs, etc.
 *
 * @property OBJECT - Searches for a DungeonObject by matching keywords. Supports
 *                    source modifiers (@room, @inventory, @all) to specify search
 *                    location. Returns the found object or undefined.
 *
 * @property MOB - Searches for a Mob entity by matching keywords in the current room.
 *                 Use for targeting players or NPCs in commands like "tell", "give",
 *                 "attack", etc. Returns the found Mob or undefined.
 *
 * @property ITEM - Searches for an Item entity by matching keywords. Supports source
 *                  modifiers (@room, @inventory, @all) to specify search location.
 *                  Use for item-specific commands. Returns the found Item or undefined.
 *
 * @property DIRECTION - Parses direction names/abbreviations into DIRECTION enum values.
 *                       Supports full names ("north") and abbreviations ("n"). Returns
 *                       DIRECTION enum value or undefined if not recognized.
 *
 * @example
 * ```typescript
 * ArgumentType.TEXT    // "hello world" -> "hello world"
 * ArgumentType.WORD    // "hello world" -> "hello"
 * ArgumentType.NUMBER  // "42 items" -> 42
 * ArgumentType.OBJECT  // "sword" -> DungeonObject (if found)
 * ArgumentType.MOB     // "bob" -> Mob (if found in room)
 * ArgumentType.ITEM    // "potion" -> Item (if found)
 * ArgumentType.DIRECTION // "north" or "n" -> DIRECTION.NORTH
 * ```
 */
export enum ArgumentType {
	TEXT = "text",
	WORD = "word",
	NUMBER = "number",
	OBJECT = "object",
	MOB = "mob",
	ITEM = "item",
	DIRECTION = "direction",
}

/**
 * Configuration for a command argument extracted from a pattern.
 *
 * This interface represents the parsed configuration of an argument placeholder
 * from a command pattern. It's extracted by analyzing the pattern string and
 * defines how the argument should be parsed and validated.
 *
 * @property name - The identifier for this argument, used as the key in the args Map.
 *                  Extracted from the pattern placeholder (e.g., "message" from "<message:text>").
 *
 * @property type - The ArgumentType defining how to parse this argument's value.
 *                  Determines validation rules and the type of value returned.
 *
 * @property required - Whether this argument must be provided. Defaults to true unless
 *                      the placeholder includes a "?" suffix (e.g., "<dir:word?>").
 *                      Required arguments cause parsing to fail if missing.
 *
 * @property source - For OBJECT type arguments, specifies where to search for the object.
 *                    Extracted from the @ modifier in the pattern (e.g., "<item:object@inventory>").
 *                    - "room": Search only in the current room's contents
 *                    - "inventory": Search only in the actor's inventory
 *                    - "all": Search both room and inventory (default)
 *
 * @example
 * Pattern "get <item:object@room>" produces:
 * ```typescript
 * {
 *   name: "item",
 *   type: ArgumentType.OBJECT,
 *   required: true,
 *   source: "room"
 * }
 * ```
 */
export interface ArgumentConfig {
	name: string;
	type: ArgumentType;
	required?: boolean;
	source?: "room" | "inventory" | "all";
}

/**
 * Base class for all commands in the MUD command system.
 *
 * This abstract class provides a powerful pattern-based command parsing system
 * that handles argument extraction, type conversion, and validation. Subclass
 * this to create custom commands with minimal boilerplate.
 *
 * ## Pattern Syntax
 *
 * Command patterns use a special placeholder syntax to define arguments:
 * - `<name:type>` - Required argument
 * - `<name:type?>` - Optional argument
 * - `<name:type@source>` - Object argument with search source
 *
 * ### Available Types
 * - `text` - Captures all remaining input (greedy)
 * - `word` - Captures a single word
 * - `number` - Parses an integer
 * - `object` - Finds a DungeonObject by keywords
 * - `player` - Finds a Movable entity by keywords
 * - `direction` - Parses a direction name/abbreviation
 *
 * ### Source Modifiers (for object type only)
 * - `@room` - Search only in the room
 * - `@inventory` - Search only in actor's inventory
 * - `@all` - Search both (default)
 *
 * ## Examples
 *
 * ### Simple text command
 * ```typescript
 * class OocCommand extends Command {
 *   pattern = "ooc <message:text>";
 *
 *   execute(context: CommandContext, args: Map<string, any>) {
 *     const message = args.get("message");
 *     console.log(`[OOC] ${context.actor.display}: ${message}`);
 *   }
 * }
 *
 * // Matches: "ooc Hello, world!"
 * // Args: { message: "Hello, world!" }
 * ```
 *
 * ### Command with optional argument
 * ```typescript
 * class LookCommand extends Command {
 *   pattern = "look <direction:word?>";
 *
 *   execute(context: CommandContext, args: Map<string, any>) {
 *     const direction = args.get("direction");
 *     if (direction) {
 *       console.log(`You look ${direction}...`);
 *     } else {
 *       console.log("You look around...");
 *     }
 *   }
 * }
 *
 * // Matches: "look" or "look north"
 * // Args: {} or { direction: "north" }
 * ```
 *
 * ### Object manipulation with source modifiers
 * ```typescript
 * class GetCommand extends Command {
 *   pattern = "get <item:object@room>";
 *
 *   execute(context: CommandContext, args: Map<string, any>) {
 *     const item = args.get("item") as DungeonObject;
 *     context.actor.add(item);
 *     console.log(`You pick up the ${item.display}.`);
 *   }
 * }
 *
 * // Matches: "get sword" (searches only in room)
 * // Args: { item: <DungeonObject> }
 * ```
 *
 * ### Multiple objects with different sources
 * ```typescript
 * class PutCommand extends Command {
 *   pattern = "put <item:object@inventory> in <container:object>";
 *
 *   execute(context: CommandContext, args: Map<string, any>) {
 *     const item = args.get("item") as DungeonObject;
 *     const container = args.get("container") as DungeonObject;
 *     container.add(item);
 *     console.log(`You put the ${item.display} in the ${container.display}.`);
 *   }
 * }
 *
 * // Matches: "put coin in bag"
 * // Args: { item: <coin from inventory>, container: <bag from room or inventory> }
 * ```
 *
 * ### Command with aliases
 * ```typescript
 * class TellCommand extends Command {
 *   pattern = "tell <player:player> <message:text>";
 *   aliases = ["whisper <player:player> <message:text>"];
 *
 *   execute(context: CommandContext, args: Map<string, any>) {
 *     const player = args.get("player") as Movable;
 *     const message = args.get("message");
 *     console.log(`You tell ${player.display}: ${message}`);
 *   }
 * }
 *
 * // Matches: "tell bob hello" or "whisper bob hello"
 * // Args: { player: <Movable>, message: "hello" }
 * ```
 *
 * ## Error Handling
 *
 * The parsing system provides detailed error messages:
 * - "Missing required argument: <name>" - Required argument not provided
 * - "Could not parse argument: <name>" - Argument value invalid for its type
 * - "Input does not match command pattern" - General mismatch
 *
 * ## Execution Flow
 *
 * 1. Input string is matched against the pattern regex
 * 2. Arguments are extracted from capture groups
 * 3. Each argument is parsed/converted based on its type
 * 4. Required arguments are validated as present
 * 5. If parsing succeeds, execute() is called with parsed args
 * 6. If parsing fails, an error message is returned
 *
 * @abstract
 * @class
 */
export abstract class Command {
	/**
	 * The command pattern using placeholder syntax.
	 *
	 * Define the structure of your command using literal text and argument
	 * placeholders. The pattern is case-insensitive when matching input.
	 *
	 * Placeholders:
	 * - `<name:type>` - Required argument
	 * - `<name:type?>` - Optional argument (with ? suffix)
	 * - `<name:type@source>` - Object argument with search source modifier
	 *
	 * Examples:
	 * - `"say <message:text>"` - Simple command with one required text argument
	 * - `"tell <player:player> <message:text>"` - Two required arguments
	 * - `"get <item:object>"` - Object argument (searches room and inventory)
	 * - `"get <item:object@room>"` - Object argument (searches only room)
	 * - `"get <item:object> from <container:object>"` - Multiple object arguments
	 * - `"look <direction:word?>"` - Optional direction argument
	 *
	 * @abstract
	 * @type {string}
	 */
	abstract pattern: string;

	/**
	 * Optional aliases for the command.
	 *
	 * Aliases are alternative patterns that trigger the same command execution.
	 * Each alias follows the same pattern syntax as the main pattern and can
	 * have different structures. When input is parsed, all patterns (main + aliases)
	 * are tried in order until one matches.
	 *
	 * This is useful for:
	 * - Providing abbreviations ("l" as an alias for "look")
	 * - Supporting alternate phrasings ("whisper" as an alias for "tell")
	 * - Backwards compatibility when changing command syntax
	 *
	 * @example
	 * ```typescript
	 * class TellCommand extends Command {
	 *   pattern = "tell <player:player> <message:text>";
	 *   aliases = [
	 *     "whisper <player:player> <message:text>",
	 *     "t <player:player> <message:text>"
	 *   ];
	 *   // ... execute implementation
	 * }
	 * // Now "tell bob hi", "whisper bob hi", and "t bob hi" all work
	 * ```
	 */
	aliases?: string[];

	/**
	 * Execute the command with parsed arguments.
	 *
	 * This method is called after the input has been successfully parsed and
	 * all arguments have been extracted and validated. Implement this method
	 * to define what your command actually does.
	 *
	 * The args Map contains all successfully parsed arguments, keyed by their
	 * names from the pattern. Optional arguments may not be present in the map
	 * if they weren't provided in the input.
	 *
	 * @param context - The execution context containing the actor, their location, and raw input
	 * @param args - Map of argument names to their parsed values
	 *
	 * @example
	 * ```typescript
	 * execute(context: CommandContext, args: Map<string, any>) {
	 *   const item = args.get("item") as DungeonObject;
	 *   const quantity = args.get("quantity") ?? 1; // Default if optional
	 *
	 *   if (!item) {
	 *     console.log("You don't have that item.");
	 *     return;
	 *   }
	 *
	 *   console.log(`You use ${quantity} ${item.display}(s).`);
	 * }
	 * ```
	 *
	 * @abstract
	 * @returns {void}
	 */
	abstract execute(context: CommandContext, args: Map<string, any>): void;

	/**
	 * Handle parsing errors with custom messaging.
	 *
	 * This optional method is called when the command pattern matches but
	 * parsing fails (missing required arguments, invalid argument values, etc.).
	 * Override this to provide custom error messages and usage information
	 * specific to your command.
	 *
	 * If not implemented, the default error message from the ParseResult is used.
	 *
	 * Common use cases:
	 * - Show usage examples for your command
	 * - Provide context-specific help
	 * - Guide users on correct syntax
	 * - Explain why their input was invalid
	 *
	 * @param context - The execution context
	 * @param result - The failed parse result containing the error message
	 * @returns {void}
	 *
	 * @example
	 * ```typescript
	 * onError(context: CommandContext, result: ParseResult) {
	 *   console.log(`Usage: ${this.pattern}`);
	 *   console.log(`Error: ${result.error}`);
	 *   console.log(`Example: tell bob Hello, how are you?`);
	 * }
	 * ```
	 *
	 * @example
	 * More detailed error handling:
	 * ```typescript
	 * onError(context: CommandContext, result: ParseResult) {
	 *   if (result.error?.includes("Missing required argument: message")) {
	 *     console.log("You need to provide a message to say!");
	 *     console.log("Usage: say <message>");
	 *     console.log('Example: say Hello, everyone!');
	 *   } else if (result.error?.includes("Could not parse argument: player")) {
	 *     console.log("That player is not here.");
	 *     console.log("Try 'look' to see who's around.");
	 *   } else {
	 *     console.log(`Error: ${result.error}`);
	 *   }
	 * }
	 * ```
	 */
	onError?(context: CommandContext, result: ParseResult): void;
	/**
	 * Parse the input against this command's pattern.
	 *
	 * This is the main entry point for command parsing. It attempts to match
	 * the input against the command's pattern and all aliases, parsing arguments
	 * and performing validation. The first pattern that successfully matches is used.
	 *
	 * The parsing process:
	 * 1. Try the main pattern, then each alias in order
	 * 2. For each pattern, build a regex and attempt to match the input
	 * 3. Extract argument values from the regex capture groups
	 * 4. Parse and validate each argument based on its type
	 * 5. Return success with parsed args, or failure with an error message
	 *
	 * Error messages are specific when possible:
	 * - "Missing required argument: <name>" when a required arg isn't provided
	 * - "Could not parse argument: <name>" when parsing/finding fails
	 * - "Input does not match command pattern" for general mismatches
	 *
	 * @param input - The raw input string from the user (typically lowercase)
	 * @param context - The execution context for finding objects/players
	 * @returns {ParseResult} Result containing success status, parsed args, and optional error
	 *
	 * @example
	 * ```typescript
	 * const command = new GetCommand();
	 * const result = command.parse("get sword", context);
	 *
	 * if (result.success) {
	 *   const item = result.args.get("item");
	 *   command.execute(context, result.args);
	 * } else {
	 *   console.log(result.error);
	 * }
	 * ```
	 */
	parse(input: string, context: CommandContext): ParseResult {
		const patterns = [this.pattern, ...(this.aliases || [])];
		let lastError = "Input does not match command pattern";

		for (const pattern of patterns) {
			const result = this.parsePattern(pattern, input, context);
			if (result.success) return result;
			// Keep the most specific error message
			if (result.error && result.error !== "Input does not match pattern") {
				lastError = result.error;
			}
		}

		return {
			success: false,
			args: new Map(),
			error: lastError,
		};
	}

	/**
	 * Parse input against a specific pattern.
	 *
	 * This internal method handles the parsing logic for a single pattern string.
	 * It builds a regex from the pattern, matches it against the input, extracts
	 * argument values from capture groups, and validates/parses each argument.
	 *
	 * The method makes all arguments optional in the regex so that missing required
	 * arguments can be detected and reported with specific error messages, rather
	 * than just failing to match.
	 *
	 * @private
	 * @param pattern - The pattern string to parse against (main pattern or alias)
	 * @param input - The user's input string
	 * @param context - The execution context for object/player lookups
	 * @returns {ParseResult} Success with args, or failure with specific error message
	 */
	private parsePattern(
		pattern: string,
		input: string,
		context: CommandContext
	): ParseResult {
		const args = new Map<string, any>();
		const argConfigs = this.extractArgumentConfigs(pattern);
		const regex = this.buildRegex(pattern);

		const match = input.match(regex);
		if (!match) {
			return {
				success: false,
				args,
				error: "Input does not match pattern",
			};
		}

		for (let i = 0; i < argConfigs.length; i++) {
			const config = argConfigs[i];
			const rawValue = match[i + 1];

			// Handle undefined or empty values
			if (!rawValue || rawValue.trim() === "") {
				if (config.required !== false) {
					return {
						success: false,
						args,
						error: `Missing required argument: ${config.name}`,
					};
				}
				// Skip optional arguments that aren't provided
				continue;
			}

			const parsedValue = this.parseArgument(rawValue.trim(), config, context);
			if (parsedValue === undefined && config.required !== false) {
				return {
					success: false,
					args,
					error: `Could not parse argument: ${config.name}`,
				};
			}

			if (parsedValue !== undefined) {
				args.set(config.name, parsedValue);
			}
		}

		return { success: true, args };
	}

	/**
	 * Extract argument configurations from a pattern string.
	 *
	 * This method analyzes a pattern string and extracts all argument placeholders,
	 * converting them into ArgumentConfig objects that define how each argument
	 * should be parsed and validated.
	 *
	 * Placeholder syntax:
	 * - `<name:type>` - Required argument
	 * - `<name:type?>` - Optional argument (? suffix)
	 * - `<name:type@source>` - Object argument with source modifier
	 *
	 * The extraction process:
	 * 1. Find all `<...>` placeholders using regex
	 * 2. Split each placeholder into name, type, and optional flag
	 * 3. Extract source modifier from type (if present)
	 * 4. Build ArgumentConfig object with parsed information
	 *
	 * @private
	 * @param pattern - The pattern string to analyze
	 * @returns {ArgumentConfig[]} Array of argument configurations in order of appearance
	 *
	 * @example
	 * Pattern: "get <item:object@room> from <container:object?>"
	 * Returns:
	 * ```typescript
	 * [
	 *   { name: "item", type: ArgumentType.OBJECT, required: true, source: "room" },
	 *   { name: "container", type: ArgumentType.OBJECT, required: false, source: "all" }
	 * ]
	 * ```
	 */
	private extractArgumentConfigs(pattern: string): ArgumentConfig[] {
		const configs: ArgumentConfig[] = [];
		const argRegex = /<([^:>]+):([^>]+?)(\?)?>/g;
		let match;

		while ((match = argRegex.exec(pattern)) !== null) {
			const [, name, typeStr, optional] = match;
			const parts = typeStr.split("@");
			const type = parts[0] as ArgumentType;
			const source = parts[1] as "room" | "inventory" | "all" | undefined;

			configs.push({
				name,
				type,
				required: !optional,
				source: source || "all",
			});
		}

		return configs;
	}

	/**
	 * Build a regex pattern from a command pattern string.
	 *
	 * This method converts a command pattern with placeholders into a regular
	 * expression that can match user input. The regex is designed to:
	 * 1. Match the literal parts of the pattern exactly (case-insensitive)
	 * 2. Capture argument values in groups for extraction
	 * 3. Make all arguments optional so missing required args can be detected
	 *
	 * The conversion process:
	 * 1. Replace all argument placeholders with temporary markers
	 * 2. Escape special regex characters in literal text
	 * 3. Replace markers with appropriate regex patterns
	 *    - Handles preceding spaces to avoid requiring double spaces
	 *    - Uses non-capturing groups for optional arguments
	 *
	 * All arguments are made optional in the regex (using `?` quantifier) so that
	 * we can provide better error messages by detecting which specific argument
	 * is missing, rather than just failing to match entirely.
	 *
	 * @private
	 * @param pattern - The command pattern with placeholders
	 * @returns {RegExp} Case-insensitive regex for matching input
	 *
	 * @example
	 * Pattern: "say <message:text>"
	 * Regex: /^say(?: (.+))?$/i
	 * Matches: "say" (message=undefined) or "say hello" (message="hello")
	 *
	 * @example
	 * Pattern: "get <item:object> from <container:object>"
	 * Regex: /^get(?: (.+?))? from(?: (.+?))?$/i
	 */
	private buildRegex(pattern: string): RegExp {
		let regexStr = pattern;

		// Replace optional patterns first (with ? suffix) - use placeholders to avoid escaping
		regexStr = regexStr
			.replace(/<[^:>]+:text\?>/g, "___OPTIONAL_TEXT___")
			.replace(/<[^:>]+:word\?>/g, "___OPTIONAL_WORD___")
			.replace(/<[^:>]+:number\?>/g, "___OPTIONAL_NUMBER___")
			.replace(/<[^:>]+:[^>]+\?>/g, "___OPTIONAL_GENERIC___");

		// Replace required patterns (no ? suffix) - but make them optional in regex for better errors
		regexStr = regexStr
			.replace(/<[^:>]+:text>/g, "___OPTIONAL_TEXT___")
			.replace(/<[^:>]+:word>/g, "___OPTIONAL_WORD___")
			.replace(/<[^:>]+:number>/g, "___OPTIONAL_NUMBER___")
			.replace(/<[^:>]+:[^>]+>/g, "___OPTIONAL_GENERIC___");

		// Escape special regex characters in the literal parts
		regexStr = regexStr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

		// Now replace the placeholders with actual regex patterns
		// For arguments with a preceding space, make the space part of the optional group
		regexStr = regexStr
			.replace(/ ___OPTIONAL_TEXT___/g, "(?: (.+))?")
			.replace(/ ___OPTIONAL_WORD___/g, "(?: (\\S+))?")
			.replace(/ ___OPTIONAL_NUMBER___/g, "(?: (\\d+))?")
			.replace(/ ___OPTIONAL_GENERIC___/g, "(?: (.+?))?")
			// Handle any remaining placeholders without preceding spaces
			.replace(/___OPTIONAL_TEXT___/g, "(?:\\s+(.+))?")
			.replace(/___OPTIONAL_WORD___/g, "(?:\\s+(\\S+))?")
			.replace(/___OPTIONAL_NUMBER___/g, "(?:\\s+(\\d+))?")
			.replace(/___OPTIONAL_GENERIC___/g, "(?:\\s+(.+?))?");

		return new RegExp(`^${regexStr}$`, "i");
	}

	/**
	 * Parse a raw string value into the appropriate type.
	 *
	 * This method handles type-specific parsing and validation for argument values.
	 * Each ArgumentType has its own parsing logic and validation rules.
	 *
	 * Type-specific behaviors:
	 * - TEXT: Returns the value as-is (no parsing)
	 * - WORD: Extracts only the first word (splits on whitespace)
	 * - NUMBER: Parses as integer, returns undefined if invalid
	 * - OBJECT: Searches for matching DungeonObject in specified source
	 * - PLAYER: Searches for matching Movable in current room
	 * - DIRECTION: Maps direction name/abbreviation to DIRECTION enum value
	 *
	 * Returns undefined if:
	 * - NUMBER: Value is not a valid integer
	 * - OBJECT: No matching object found in search locations
	 * - PLAYER: No matching player found in room
	 * - DIRECTION: Direction name not recognized
	 *
	 * @private
	 * @param value - The raw string value extracted from input
	 * @param config - The argument configuration defining type and source
	 * @param context - The execution context for object/player lookups
	 * @returns {any} The parsed value, or undefined if parsing fails
	 *
	 * @example
	 * parseArgument("5", { type: ArgumentType.NUMBER }, context)
	 * // Returns: 5
	 *
	 * @example
	 * parseArgument("sword", { type: ArgumentType.OBJECT, source: "room" }, context)
	 * // Returns: <DungeonObject> or undefined
	 */
	private parseArgument(
		value: string,
		config: ArgumentConfig,
		context: CommandContext
	): any {
		switch (config.type) {
			case ArgumentType.TEXT:
				return value;

			case ArgumentType.WORD:
				return value.split(/\s+/)[0];

			case ArgumentType.NUMBER:
				const num = parseInt(value, 10);
				return isNaN(num) ? undefined : num;

			case ArgumentType.OBJECT:
				return this.findObject(value, config.source || "all", context);

			case ArgumentType.MOB:
				return this.findMob(value, context);

			case ArgumentType.ITEM:
				return this.findItem(value, config.source || "all", context);

			case ArgumentType.DIRECTION:
				return this.parseDirection(value);

			default:
				return value;
		}
	}

	/**
	 * Find an object by keywords in the specified source.
	 *
	 * This method searches for a DungeonObject that matches the given keywords,
	 * respecting the source modifier to determine where to search.
	 *
	 * Search locations by source:
	 * - "room": Current room contents + objects inside room containers
	 * - "inventory": Actor's inventory contents only
	 * - "all": Both room and inventory (default)
	 *
	 * The search uses the DungeonObject's keyword matching system, which supports
	 * partial matches and handles multiple keywords. The first matching object
	 * is returned.
	 *
	 * Nested container support: When searching in the room, this method also
	 * searches inside containers (objects with contents), allowing commands like
	 * "get coin from chest" to work properly.
	 *
	 * @private
	 * @param keywords - The keywords to search for (from user input)
	 * @param source - Where to search: "room", "inventory", or "all"
	 * @param context - The execution context providing room and actor
	 * @returns {DungeonObject | undefined} First matching object, or undefined if none found
	 *
	 * @example
	 * // Search for "sword" in room only
	 * findObject("sword", "room", context)
	 * // Returns: <DungeonObject with keywords "sword"> or undefined
	 *
	 * @example
	 * // Search for "coin" in actor's inventory
	 * findObject("coin", "inventory", context)
	 * // Returns: <DungeonObject> from actor.contents or undefined
	 */
	private findObject(
		keywords: string,
		source: "room" | "inventory" | "all",
		context: CommandContext
	): DungeonObject | undefined {
		const searchLocations: DungeonObject[] = [];

		if ((source === "room" || source === "all") && context.room) {
			searchLocations.push(...context.room.contents);
			// Also search inside containers in the room
			for (const obj of context.room.contents) {
				searchLocations.push(...obj.contents);
			}
		}

		if (source === "inventory" || source === "all") {
			searchLocations.push(...context.actor.contents);
		}

		return searchLocations.find((obj) => obj.match(keywords));
	}

	/**
	 * Find a mob by keywords.
	 *
	 * This method searches for a Mob entity (player or NPC) in the current
	 * room that matches the given keywords. Only searches the room's contents
	 * for Mob objects.
	 *
	 * Unlike findObject, this method only searches Mob entities because
	 * mob-targeting commands (tell, attack, give, etc.) should only target
	 * entities that can act, not inanimate objects or generic items.
	 *
	 * Returns undefined if:
	 * - The actor is not in a room (context.room is undefined)
	 * - No Mob entity in the room matches the keywords
	 *
	 * @private
	 * @param keywords - The keywords to search for (typically a name)
	 * @param context - The execution context providing the room
	 * @returns {Mob | undefined} First matching Mob, or undefined if none found
	 *
	 * @example
	 * // Search for "bob" in current room
	 * findMob("bob", context)
	 * // Returns: <Mob with keywords "bob"> or undefined
	 */
	private findMob(keywords: string, context: CommandContext): Mob | undefined {
		if (!context.room) return undefined;

		return context.room.contents.find(
			(obj) => obj instanceof Mob && obj.match(keywords)
		) as Mob | undefined;
	}

	/**
	 * Find an item by keywords in the specified source.
	 *
	 * This method searches for an Item entity that matches the given keywords,
	 * respecting the source modifier to determine where to search.
	 *
	 * Search locations by source:
	 * - "room": Current room contents + items inside room containers
	 * - "inventory": Actor's inventory contents only
	 * - "all": Both room and inventory (default)
	 *
	 * The search uses the Item's keyword matching system, which supports
	 * partial matches and handles multiple keywords. The first matching item
	 * is returned.
	 *
	 * Nested container support: When searching in the room, this method also
	 * searches inside containers (objects with contents), allowing commands like
	 * "get potion from bag" to work properly.
	 *
	 * @private
	 * @param keywords - The keywords to search for (from user input)
	 * @param source - Where to search: "room", "inventory", or "all"
	 * @param context - The execution context providing room and actor
	 * @returns {Item | undefined} First matching item, or undefined if none found
	 *
	 * @example
	 * // Search for "potion" in room only
	 * findItem("potion", "room", context)
	 * // Returns: <Item with "potion" keywords> or undefined
	 */
	private findItem(
		keywords: string,
		source: "room" | "inventory" | "all",
		context: CommandContext
	): Item | undefined {
		const searchLocations: DungeonObject[] = [];

		// Add room contents if needed
		if (source !== "inventory" && context.room) {
			searchLocations.push(...context.room.contents);
			// Also search inside containers in the room
			for (const obj of context.room.contents) {
				if (obj.contents.length > 0) {
					searchLocations.push(...obj.contents);
				}
			}
		}

		// Add inventory if needed
		if (source !== "room") {
			searchLocations.push(...context.actor.contents);
		}

		return searchLocations.find(
			(obj) => obj instanceof Item && obj.match(keywords)
		) as Item | undefined;
	}

	/**
	 * Parse a direction string into a DIRECTION enum value.
	 *
	 * This method converts user-friendly direction names and abbreviations into
	 * the numeric DIRECTION enum values used internally by the dungeon system.
	 * The matching is case-insensitive.
	 *
	 * Supported directions:
	 * - Cardinal: north/n, south/s, east/e, west/w
	 * - Vertical: up/u, down/d
	 * - Diagonal: northeast/ne, northwest/nw, southeast/se, southwest/sw
	 *
	 * @private
	 * @param value - The direction string from user input
	 * @returns {DIRECTION | undefined} DIRECTION enum, or undefined if not recognized
	 *
	 * @example
	 * parseDirection("north") // Returns: DIRECTION.NORTH
	 * parseDirection("n")     // Returns: DIRECTION.NORTH
	 * parseDirection("ne")    // Returns: DIRECTION.NORTHEAST
	 * parseDirection("xyz")   // Returns: undefined
	 */
	private parseDirection(value: string): DIRECTION | undefined {
		const dirMap: { [key: string]: DIRECTION } = {
			north: DIRECTION.NORTH,
			n: DIRECTION.NORTH,
			south: DIRECTION.SOUTH,
			s: DIRECTION.SOUTH,
			east: DIRECTION.EAST,
			e: DIRECTION.EAST,
			west: DIRECTION.WEST,
			w: DIRECTION.WEST,
			northeast: DIRECTION.NORTHEAST,
			ne: DIRECTION.NORTHEAST,
			northwest: DIRECTION.NORTHWEST,
			nw: DIRECTION.NORTHWEST,
			southeast: DIRECTION.SOUTHEAST,
			se: DIRECTION.SOUTHEAST,
			southwest: DIRECTION.SOUTHWEST,
			sw: DIRECTION.SOUTHWEST,
			up: DIRECTION.UP,
			u: DIRECTION.UP,
			down: DIRECTION.DOWN,
			d: DIRECTION.DOWN,
		};

		return dirMap[value.toLowerCase()];
	}
}

/**
 * Registry and executor for commands.
 *
 * CommandRegistry manages a collection of Command instances and provides
 * centralized command execution. It attempts to parse user input against
 * all registered commands in order, executing the first command that
 * successfully matches.
 *
 * This class is the main entry point for processing user commands in a MUD
 * application. Typically, you create one global registry, register all your
 * command classes with it, and then call execute() for each line of user input.
 *
 * ## Usage Pattern
 *
 * ```typescript
 * // Setup phase: Create registry and register commands
 * const registry = new CommandRegistry();
 * registry.register(new SayCommand());
 * registry.register(new GetCommand());
 * registry.register(new LookCommand());
 * // ... register more commands
 *
 * // Runtime: Process user input
 * const context: CommandContext = {
 *   actor: currentPlayer,
 *   room: currentRoom,
 *   input: userInput
 * };
 *
 * const executed = registry.execute(userInput, context);
 * if (!executed) {
 *   console.log("Unknown command. Type 'help' for assistance.");
 * }
 * ```
 *
 * ## Command Priority
 *
 * Commands are tried in the order they were registered. If multiple commands
 * could match the same input, the first one registered wins. Place more
 * specific commands before more general ones:
 *
 * ```typescript
 * // Good: Specific before general
 * registry.register(new GetAllCommand());  // "get all"
 * registry.register(new GetCommand());     // "get <item>"
 *
 * // Bad: General before specific
 * registry.register(new GetCommand());     // Would catch "get all" first
 * registry.register(new GetAllCommand());  // Would never match
 * ```
 *
 * ## Best Practices
 *
 * 1. Register commands once at startup, not per-execution
 * 2. Order commands from most specific to least specific
 * 3. Use command aliases for alternate phrasings, not separate commands
 * 4. Handle "command not found" case after execute() returns false
 * 5. Consider using a command factory or plugin system for dynamic loading
 *
 * @class
 */
export class CommandRegistry {
	private commands: Command[] = [];

	/**
	 * Register a command in the registry.
	 *
	 * Adds a command instance to the registry's collection. Once registered,
	 * the command will be considered when execute() is called with user input.
	 *
	 * Commands are automatically sorted by pattern length (longest first) to ensure
	 * more specific commands are tried before more general ones. This means you can
	 * register commands in any order without worrying about matching priority.
	 *
	 * For example, if you register:
	 * - "get <item:object@room>" (26 chars)
	 * - "get <item:object@inventory> from <container:object@room>" (58 chars)
	 *
	 * They will automatically be ordered with the longer, more specific pattern first,
	 * regardless of registration order.
	 *
	 * The same command instance can only be registered once. If you need
	 * multiple instances of a command (e.g., for different contexts), create
	 * separate instances.
	 *
	 * @param command - The Command instance to register
	 * @returns {void}
	 *
	 * @example
	 * ```typescript
	 * const registry = new CommandRegistry();
	 * registry.register(new SayCommand());
	 * registry.register(new GetFromContainerCommand()); // Longer pattern
	 * registry.register(new GetCommand()); // Shorter pattern
	 * // GetFromContainerCommand will be tried first automatically
	 * ```
	 */
	register(command: Command): void {
		this.commands.push(command);
		// Sort by pattern length (longest first) to prioritize more specific commands
		this.commands.sort((a, b) => b.pattern.length - a.pattern.length);
	}

	/**
	 * Unregister a command from the registry.
	 *
	 * Removes a previously registered command instance from the registry.
	 * After unregistering, the command will no longer be considered for
	 * execution when execute() is called.
	 *
	 * If the command is not currently registered, this method does nothing.
	 * Uses reference equality to find the command, so you must pass the
	 * exact same instance that was registered.
	 *
	 * The remaining commands will stay in their sorted order (by pattern length).
	 *
	 * This is useful for:
	 * - Temporarily disabling commands
	 * - Context-sensitive command availability (e.g., combat vs non-combat)
	 * - Dynamic command loading/unloading
	 * - Plugin systems that add/remove commands
	 *
	 * @param command - The Command instance to unregister (must be same instance)
	 * @returns {void}
	 *
	 * @example
	 * ```typescript
	 * const sayCommand = new SayCommand();
	 * registry.register(sayCommand);
	 * // ... later
	 * registry.unregister(sayCommand); // Removes the command
	 * ```
	 */
	unregister(command: Command): void {
		const index = this.commands.indexOf(command);
		if (index !== -1) {
			this.commands.splice(index, 1);
		}
	}

	/**
	 * Execute a command string for the given context.
	 *
	 * This is the main entry point for command execution. It attempts to parse
	 * the input against all registered commands in order, and executes the first
	 * command that successfully matches.
	 *
	 * The execution process:
	 * 1. Trim whitespace from input
	 * 2. Return false immediately if input is empty
	 * 3. Try each registered command's parse() method in order
	 * 4. On successful parse, call that command's execute() method
	 * 5. On failed parse, call the command's onError() method if implemented
	 * 6. Return true if a command was matched (even if parsing failed), false if none matched
	 *
	 * The return value indicates whether a command pattern was matched, not whether
	 * the command fully succeeded. Commands handle their own success/failure messaging,
	 * and parsing errors are handled by the command's onError() method if implemented.
	 *
	 * When a command pattern matches but parsing fails (e.g., missing required argument),
	 * the command's onError() method is called to let the command provide custom error
	 * messages and usage information. If onError() is not implemented, no error message
	 * is displayed (you should implement onError() to guide users).
	 *
	 * Empty input is handled gracefully and returns false without trying
	 * any commands, allowing you to distinguish between "no input" and
	 * "invalid command".
	 *
	 * @param input - The user's input string (will be trimmed)
	 * @param context - The execution context with actor, room, and original input
	 * @returns {boolean} True if a command pattern was matched, false if no command matched
	 *
	 * @example
	 * ```typescript
	 * const executed = registry.execute("say hello world", context);
	 * if (executed) {
	 *   // Command was found (executed successfully or onError was called)
	 * } else {
	 *   // No command matched
	 *   console.log("Huh? Type 'help' for a list of commands.");
	 * }
	 * ```
	 *
	 * @example
	 * Handle empty input:
	 * ```typescript
	 * const input = userInput.trim();
	 * if (!input) {
	 *   // Don't bother calling execute for empty input
	 *   return;
	 * }
	 *
	 * const executed = registry.execute(input, context);
	 * // ...
	 * ```
	 */
	execute(input: string, context: CommandContext): boolean {
		input = input.trim();
		if (!input) return false;

		for (const command of this.commands) {
			const result = command.parse(input, context);
			if (result.success) {
				command.execute(context, result.args);
				return true;
			}
			// If pattern matched but parsing failed, call onError if implemented
			if (
				result.error &&
				result.error !== "Input does not match pattern" &&
				result.error !== "Input does not match command pattern"
			) {
				if (command.onError) {
					command.onError(context, result);
				}
				return true;
			}
		}

		return false;
	}

	/**
	 * Get all registered commands.
	 *
	 * Returns a shallow copy of the internal commands array. The returned
	 * array can be modified without affecting the registry, but the Command
	 * instances themselves are the same references.
	 *
	 * This is useful for:
	 * - Debugging and introspection
	 * - Building dynamic help systems
	 * - Displaying available commands to users
	 * - Testing and validation
	 *
	 * The commands are returned in registration order, which is also the
	 * order they'll be tried during execution.
	 *
	 * @returns {Command[]} A copy of the commands array
	 *
	 * @example
	 * ```typescript
	 * // Display all available commands
	 * const commands = registry.getCommands();
	 * console.log("Available commands:");
	 * for (const command of commands) {
	 *   console.log(`  ${command.pattern}`);
	 *   if (command.aliases) {
	 *     console.log(`    Aliases: ${command.aliases.join(", ")}`);
	 *   }
	 * }
	 * ```
	 *
	 * @example
	 * Check if a specific command is registered:
	 * ```typescript
	 * const hasSayCommand = registry.getCommands()
	 *   .some(cmd => cmd instanceof SayCommand);
	 * ```
	 */
	getCommands(): Command[] {
		return [...this.commands];
	}
}
