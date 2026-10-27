import { Middleware } from "@reduxjs/toolkit";
import { redactPortfolioSourceAction } from "@features/platform-account-source-portfolio";
import { redactCardApiAction, redactPortfolioApiAction } from "@shared/api-services";
import logger from "~/renderer/logger";
import { State } from "../reducers";
import { isActionWithType } from "./utils";

const loggerMiddleware: Middleware<object, State> = () => next => action => {
  if (isActionWithType(action)) {
    logger.onReduxAction(
      redactPortfolioSourceAction(redactPortfolioApiAction(redactCardApiAction(action))),
    );
  }
  return next(action);
};

export default loggerMiddleware;
