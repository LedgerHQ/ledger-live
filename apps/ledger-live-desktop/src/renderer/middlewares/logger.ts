import { Middleware } from "@reduxjs/toolkit";
import { redactAccountContextAction } from "@domain/entity-account-context";
import { redactCardApiAction, redactPortfolioApiAction } from "@shared/api-services";
import logger from "~/renderer/logger";
import { State } from "../reducers";
import { isActionWithType } from "./utils";

const loggerMiddleware: Middleware<object, State> = () => next => action => {
  if (isActionWithType(action)) {
    logger.onReduxAction(
      redactAccountContextAction(redactPortfolioApiAction(redactCardApiAction(action))),
    );
  }
  return next(action);
};

export default loggerMiddleware;
