import type { DialogBackgroundTone } from "../background/DialogBackgroundContext.web";
import type { InfoStateProps } from "../types.web";

export function getInfoStateDialogTone(props: InfoStateProps): DialogBackgroundTone | undefined {
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
