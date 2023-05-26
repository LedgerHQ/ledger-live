import { createStore, applyMiddleware, compose, Middleware } from "redux";
import thunk from "redux-thunk";
import logger from "~/renderer/middlewares/logger";
import analytics from "~/renderer/middlewares/analytics";
import reducers, { State } from "~/renderer/reducers";
type Props = {
  state?: State;
  dbMiddleware?: Middleware;
};
export default ({ state, dbMiddleware }: Props) => {
  const middlewares: Middleware[] = [thunk, logger];

  // middlewares.push(require('./../middlewares/sentry').default)
  middlewares.push(analytics);
  if (dbMiddleware) {
    middlewares.push(dbMiddleware);
  }
  const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
  const enhancers = composeEnhancers(applyMiddleware(...middlewares));

  return createStore(reducers, state, enhancers);
};
