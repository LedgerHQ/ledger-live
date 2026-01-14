import { Middleware } from "@reduxjs/toolkit";
import logger from "~/renderer/logger";
import { State } from "../reducers";
import { isActionWithType } from "./utils";

const loggerMiddleware: Middleware<object, State> = () => next => action => {
  if (isActionWithType(action)) {
    logger.onReduxAction(action);
  }
  return next(action);
};

export default loggerMiddleware;
