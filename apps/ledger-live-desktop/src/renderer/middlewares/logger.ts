import { Middleware } from "@reduxjs/toolkit";
import { redactCardApiAction } from "@shared/api-services";
import logger from "~/renderer/logger";
import { State } from "../reducers";
import { isActionWithType } from "./utils";

const loggerMiddleware: Middleware<object, State> = () => next => action => {
  if (isActionWithType(action)) {
    logger.onReduxAction(redactCardApiAction(action));
  }
  return next(action);
};

export default loggerMiddleware;
