
/**
 * Represents a command that can be executed and undone.
 */
export interface Command {
  execute(): void;
  undo(): void;
}
