import { applyMiddleware, compose, createStore, Middleware } from "redux";
import thunk from "redux-thunk";
import logger from "~/renderer/middlewares/logger";
import reducers, { State } from "~/renderer/reducers";

type Props = {
  state?: State;
  dbMiddleware?: Middleware;
  analyticsMiddleware?: Middleware;
};

const customCreateStore = ({ state, dbMiddleware, analyticsMiddleware }: Props) => {
  const middlewares: Middleware[] = [thunk, logger];

  // middlewares.push(require('./../middlewares/sentry').default)
  if (analyticsMiddleware) {
    middlewares.push(analyticsMiddleware);
  }
  if (dbMiddleware) {
    middlewares.push(dbMiddleware);
  }
  const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
  const enhancers = composeEnhancers(applyMiddleware(...middlewares));

  return createStore(reducers, state, enhancers);
};

export type ReduxStore = ReturnType<typeof customCreateStore>;

export default customCreateStore;
