import logger from "~/renderer/logger";
export default () => (next: any) => (action: any) => {
  logger.onReduxAction(action);
  return next(action);
};
