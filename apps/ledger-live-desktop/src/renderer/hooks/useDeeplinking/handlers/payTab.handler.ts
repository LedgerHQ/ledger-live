import { DeeplinkHandler } from "../types";
import { defaultHandler } from "./default.handler";

export const payTabHandler: DeeplinkHandler<"paytab"> = (_route, context) => {
  if (!context.isPayTabEnabled) {
    return defaultHandler({ type: "default" }, context);
  }

  context.navigate("/paytab");
};
