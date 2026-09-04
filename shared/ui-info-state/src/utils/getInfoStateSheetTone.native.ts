import type { BottomSheetBackgroundTone } from "@shared/ui-queued-bottom-sheet";
import type { InfoStateProps } from "../types.native";

export function getInfoStateSheetTone(
  preset: InfoStateProps["preset"],
): BottomSheetBackgroundTone | undefined {
  switch (preset) {
    case "error":
      return "error";
    case "info":
      return "info";
    case "success":
      return "success";
    case "illustration":
    case "spot":
    case "text":
      return undefined;
    default:
      return assertNever(preset);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled info state preset: ${JSON.stringify(value)}`);
}
