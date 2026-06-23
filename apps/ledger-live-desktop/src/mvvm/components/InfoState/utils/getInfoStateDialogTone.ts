import type { DialogBackgroundTone } from "LLD/contexts/DialogBackgroundContext";
import type { InfoStateProps } from "../types";

export function getInfoStateDialogTone(
  preset: InfoStateProps["preset"],
): DialogBackgroundTone | undefined {
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
