import {
  ApplyUpdatesStateType,
  type ApplyUpdatesState,
} from "../../../api/model/ApplyUpdatesState";

/**
 * Unlike its siblings, two states of the same type are not interchangeable here: the progress
 * states are the only thing moving the bar, so they are compared on their values too.
 */
export const isSameState = (previous: ApplyUpdatesState, next: ApplyUpdatesState): boolean => {
  if (previous.type !== next.type) {
    return false;
  }

  if (
    previous.type === ApplyUpdatesStateType.UPDATING &&
    next.type === ApplyUpdatesStateType.UPDATING
  ) {
    return (
      previous.progress === next.progress &&
      previous.updateIndex === next.updateIndex &&
      previous.updateCount === next.updateCount
    );
  }

  if (
    previous.type === ApplyUpdatesStateType.RESTORING &&
    next.type === ApplyUpdatesStateType.RESTORING
  ) {
    return previous.progress === next.progress;
  }

  return true;
};
