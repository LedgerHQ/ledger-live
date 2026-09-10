import { DeeplinkHandler } from "../types";
import { defaultHandler } from "./default.handler";

export const payTabHandler: DeeplinkHandler<"paytab"> = (route, context) => {
  if (!context.isPayTabEnabled) {
    return defaultHandler({ type: "default" }, context);
  }

  // The code travels as router state, because an authorization code has no business in a kept URL.
  context.navigate("/paytab", route.code ? { code: route.code } : undefined);
};
