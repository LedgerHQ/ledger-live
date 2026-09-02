import { Middleware } from "@reduxjs/toolkit";
import { redactCardApiAction } from "@shared/api-services";
import logger from "~/renderer/logger";
import { State } from "../reducers";
import { isActionWithType } from "./utils";

const loggerMiddleware: Middleware<object, State> = () => next => action => {
  if (isActionWithType(action)) {
    // The logger writes to the buffer that ExportLogsButton saves to the file users attach to a
    // support ticket, and the only gate is NO_DEBUG_ACTION, so it runs in production. The Card api's
    // arguments and payloads are OAuth2 credentials. Strip them before the logger reads them.
    logger.onReduxAction(redactCardApiAction(action));
  }
  return next(action);
};

export default loggerMiddleware;
