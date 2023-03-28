// @flow

import logger from "~/renderer/logger";

export default () => (next: *) => (action: *) => {
  logger.onReduxAction(action);
  return next(action);
};
