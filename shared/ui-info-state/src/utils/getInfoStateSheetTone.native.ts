import type { BottomSheetBackgroundTone } from "@shared/ui-queued-bottom-sheet";
import type { InfoStateProps } from "../InfoState.types";

export function getInfoStateSheetTone(
  props: InfoStateProps,
): BottomSheetBackgroundTone | undefined {
  switch (props.preset) {
    case "error":
      return "error";
    case "info":
      return "info";
    case "success":
      return "success";
    case "spot":
      return props.backgroundTone;
    case "illustration":
    case "text":
      return undefined;
    default:
      return assertNever(props);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled info state preset: ${JSON.stringify(value)}`);
}
