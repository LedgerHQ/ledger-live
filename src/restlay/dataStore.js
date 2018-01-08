//@flow
import { normalize } from "normalizr-gre";
import URL from "url";
import Mutation from "./Mutation";
import Query from "./Query";
import ConnectionQuery from "./ConnectionQuery";
import type { Connection } from "./ConnectionQuery";
import { merge } from "./ImmutableUtils";
import isEqual from "lodash/isEqual";
import type RestlayProvider from "./RestlayProvider";

export const DATA_FETCHED = "@@restlay/DATA_FETCHED";
export const DATA_FETCHED_FAIL = "@@restlay/DATA_FETCHED_FAIL";

const DATA_CONNECTION_SPLICE = "@@restlay/DATA_CONNECTION_SPLICE";

export type Entities = {
  [_: string]: { [_: string]: Object }
};
type Result<R> = {
  result: R,
  time: number
};

export type Store = {
  entities: Entities,
  results: { [_: string]: Result<any> }
};

type DispatchF = (action: Object) => void;
type GetState = () => { data: Store };

export function getPendingQueryResult<R>(
  store: Store,
  query: Query<any, R> | ConnectionQuery<any, any>
): ?Result<R> {
  return store.results[query.getCacheKey()];
}

export function queryCacheIsFresh(store: Store, query: Query<*, *>): boolean {
  const cache = getPendingQueryResult(store, query);
  if (!cache) return false;
  return Date.now() < cache.time + 1000 * query.cacheMaxAge;
}

const initialState: Store = {
  entities: {},
  results: {}
};

// NB we do not preserve the entities object immutable, but only for the object entity itself
function mergeEntities(prev: Entities, patch: Entities): Entities {
  const all = { ...patch, ...prev }; // potentially there are new collections
  const entities = {};
  for (let type in all) {
    const patchColl = patch[type];
    const oldColl = all[type];
    entities[type] = merge(oldColl, patchColl, isEqual);
  }
  return entities;
}

const emptyConnection: Connection<any> = {
  edges: [],
  pageInfo: { hasNextPage: true }
};

const accumulateConnectionEdges = <T>(
  oldConnection: ?Connection<T>,
  connection: Connection<T>
): Connection<T> => {
  if (!oldConnection) return connection;
  const pageInfo = { ...connection.pageInfo };
  if (connection.pageInfo.hasNextPage && connection.edges.length === 0) {
    console.warn(
      "API issue: connection says hasNextPage but edges.length is 0!"
    );
    pageInfo.hasNextPage = false;
  }
  const edges = oldConnection.edges.concat(connection.edges);
  if (process.env.NODE_ENV === "development" && oldConnection) {
    const cursors = {};
    edges.forEach((e, i) => {
      if (!e.cursor) {
        console.warn("API issue: an edge must have a cursor defined");
      }
      if (cursors[e.cursor]) {
        console.warn(
          "API issue: duplicate cursor found at index " + i + ": " + e.cursor
        );
      }
      cursors[e.cursor] = true;
    });
  }
  return {
    edges,
    pageInfo
  };
};

const sliceConnection = <T>(
  connection: Connection<T>,
  length: number
): Connection<T> => ({
  pageInfo: { hasNextPage: true },
  edges: connection.edges.slice(0, length)
});

// TODO we need to split into more functions:
// one for mutation
// one for query
// one for connection query (or more functions, initial query / more page ?)

export const executeQueryOrMutation =
  // network is dynamically provided so the library can be mocked (e.g. for tests)
  (ctx: RestlayProvider) => <Out>(
    queryOrMutation:
      | Query<any, Out>
      | Mutation<any, Out>
      | ConnectionQuery<any, any>
  ) => (dispatch: DispatchF, getState: GetState) => {
    let uri = queryOrMutation.uri;
    let cacheKey, method, body;

    // TODO ConnectionQuery don't stick very well in the normal Query paradigm
    // and later we might really split into 2 different parts
    if (queryOrMutation instanceof ConnectionQuery) {
      const store = getState();
      const cache = getPendingQueryResult(store.data, queryOrMutation);
      const size = queryOrMutation.getSize();
      const shouldReset = !queryOrMutation.firstQueryDone;
      // FIXME this is a hack! need a better refactoring of all of these
      const count =
        cache && !shouldReset
          ? cache.result.pageInfo.hasNextPage
            ? size - cache.result.edges.length
            : 0
          : size;
      if (count < 0) {
        const cacheKey = queryOrMutation.getCacheKey();
        //$FlowFixMe
        return Promise.resolve().then(() => {
          // needs to happen in async
          dispatch({
            type: DATA_CONNECTION_SPLICE,
            cacheKey,
            size,
            queryOrMutation
          });
          return cache ? sliceConnection(cache.result, size) : emptyConnection;
        });
      } else if (count === 0) {
        // $FlowFixMe
        return Promise.resolve((cache && cache.result) || emptyConnection);
      } else {
        const params = queryOrMutation.getPaginationURLParams(
          count,
          shouldReset || !cache || cache.result.edges.length === 0
            ? undefined
            : cache.result.edges[cache.result.edges.length - 1].cursor
        );
        const { pathname, query } = URL.parse(uri, true);
        uri = URL.format({
          pathname,
          query: { ...query, ...params }
        });
      }
    }

    if (queryOrMutation instanceof Mutation) {
      method = queryOrMutation.method;
      body = queryOrMutation.getBody();
    } else {
      cacheKey = queryOrMutation.getCacheKey();
      const pendingPromise = ctx.getPendingQuery(queryOrMutation);
      if (pendingPromise) return pendingPromise;
      method = "GET";
    }
    const promise = ctx
      .network(uri, method, body)
      .then(data => {
        const result = normalize(
          data,
          queryOrMutation.getResponseSchema() || {}
        );
        let resetConnection = false;
        if (
          queryOrMutation instanceof Query ||
          queryOrMutation instanceof ConnectionQuery
        ) {
          ctx.removePendingQuery(queryOrMutation);
        }
        if (queryOrMutation instanceof ConnectionQuery) {
          resetConnection = !queryOrMutation.firstQueryDone;
          queryOrMutation.firstQueryDone = true;
        }
        dispatch({
          type: DATA_FETCHED,
          result,
          queryOrMutation,
          cacheKey,
          resetConnection
        });
        return data;
      })
      .catch(error => {
        if (
          queryOrMutation instanceof Query ||
          queryOrMutation instanceof ConnectionQuery
        ) {
          ctx.removePendingQuery(queryOrMutation);
        }
        dispatch({
          type: DATA_FETCHED_FAIL,
          error,
          queryOrMutation,
          cacheKey
        });
        throw error;
      });

    if (
      queryOrMutation instanceof Query ||
      queryOrMutation instanceof ConnectionQuery
    ) {
      ctx.setPendingQuery(queryOrMutation, promise);
    }
    return promise;
  };

const reducers = {
  [DATA_CONNECTION_SPLICE]: (store, { size, cacheKey }) => {
    if (!cacheKey) {
      return store;
    } else {
      return {
        ...store,
        results: {
          ...store.results,
          [cacheKey]: {
            result: sliceConnection(store.results[cacheKey].result, size),
            time: Date.now()
          }
        }
      };
    }
  },
  [DATA_FETCHED]: (
    store,
    { queryOrMutation, result, cacheKey, resetConnection }
  ) => {
    const entities = mergeEntities(store.entities, result.entities);
    if (!cacheKey) {
      return { ...store, entities };
    } else {
      return {
        entities,
        results: {
          ...store.results,
          [cacheKey]: {
            result:
              queryOrMutation instanceof ConnectionQuery && !resetConnection
                ? accumulateConnectionEdges(
                    // FIXME this is always appending, there is no way to reset this..
                    // actually will need to differenciate the initial FETCH from PAGINATE
                    // also there will be some obvious DEV checks to do, like there is not supposed to be dups in cursors ...
                    store.results[cacheKey] && store.results[cacheKey].result,
                    result.result
                  )
                : result.result,
            time: Date.now()
          }
        }
      };
    }
  }
};

export const reducer = (state: * = initialState, action: Object) => {
  if (action.type in reducers) {
    const patch = reducers[action.type](state, action);
    if (patch) {
      return { ...state, ...patch };
    }
  }
  return state;
};
