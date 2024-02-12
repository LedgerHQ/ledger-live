import { LockedDeviceError, UnresponsiveDeviceError } from "@ledgerhq/errors";
import { SharedTaskEvent } from "../tasks/core";

// Represents the state that is shared with any action
// The type of the error prop is specific to the action
export type SharedActionState = {
  lockedDevice: boolean;
  error: {
    type: "SharedError";
    message: string;
    name: string;

    /**
     * Informs if the action and its associated task in error is attempting to retry
     */
    retrying: boolean;
  } | null;
};

// Mix the specific action state with the shared state
// The type of the error prop is the union of the specific action error and the shared error
// The resulting type contains all the props of the specific action state and the shared state
export type FullActionState<SpecificActionState extends { error: unknown }> = Omit<
  SpecificActionState,
  "error"
> &
  Omit<SharedActionState, "error"> & {
    error: SpecificActionState["error"] | SharedActionState["error"] | null;
  };

/**
 * Handles SharedTaskEvent that are not handled by specific action
 *
 * @param event The event not handled by the specific action
 * @returns An updated partial SharedActionState, the shared state of the state
 */
export function sharedReducer({ event }: { event: SharedTaskEvent }): Partial<SharedActionState> {
  switch (event.type) {
    // Handles shared errors coming from a task
    case "error": {
      const { error, retrying } = event;
      const { name, message } = error;

      if (
        error instanceof LockedDeviceError ||
        (error as unknown) instanceof UnresponsiveDeviceError
      ) {
        // Propagates the error so the consumer can distinguish locked (from error response) and unresponsive error.
        return { lockedDevice: true, error: { type: "SharedError", name, message, retrying } };
      }

      // Maps any other unhandled error to a SharedError with a specific message
      return {
        error: {
          type: "SharedError",
          name,
          message,
          retrying,
        },
        lockedDevice: false,
      };
    }
    default:
      return {};
  }
}

// Instantiates the shared initial state
export const initialSharedActionState: SharedActionState = {
  lockedDevice: false,
  error: null,
};
