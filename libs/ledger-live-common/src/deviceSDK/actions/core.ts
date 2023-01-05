import { LockedDeviceError } from "@ledgerhq/errors";
import { SharedTaskEvent } from "../tasks/core";

// Representes any error that are not task specific
export type SharedActionErrorType = "SharedError";

// Represents any error that happened during the action: task specific ones, or shared ones
export type ActionError<ActionErrorType> = {
  type: ActionErrorType;
  message?: string;
};

// Represents the state that is shared with any action
// The type of the error prop is specific to the action
export type SharedActionState<ActionErrorType> = {
  lockedDevice: boolean;
  error: ActionError<ActionErrorType | SharedActionErrorType> | null;
};

/**
 * Handles SharedTaskEvent that are not handled by specific action
 *
 * @param currentState The shared state of the current state
 * @param event The event not handled by the specific action
 * @returns An updated SharedActionState, the shared state of the state
 */
export function sharedReducer<ActionErrorType>({
  currentState,
  event,
}: {
  currentState: SharedActionState<ActionErrorType>;
  event: SharedTaskEvent;
}): SharedActionState<ActionErrorType> {
  switch (event.type) {
    // Handles shared errors coming from a task
    case "error": {
      const { error } = event;
      const { name, message } = error;

      if (error instanceof LockedDeviceError) {
        return { ...currentState, lockedDevice: true };
      }

      // Maps any other unhandled error to a SharedError with a specific message
      return {
        ...currentState,
        error: {
          type: "SharedError",
          message: `${name}: ${message}`,
        },
      };
    }
    default:
      return currentState;
  }
}

// Instantiates the shared initial state
export function getSharedInitialState<
  ActionErrorType
>(): SharedActionState<ActionErrorType> {
  return {
    lockedDevice: false,
    error: null,
  };
}
