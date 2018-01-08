//@flow
import { connect } from "react-redux";
import invariant from "invariant";
import React, { Component } from "react";
import PropTypes from "prop-types";
import shallowEqual from "fbjs/lib/shallowEqual";
import isEqual from "lodash/isEqual";
import {
  executeQueryOrMutation,
  getPendingQueryResult,
  queryCacheIsFresh
} from "./dataStore";
import type { Store } from "./dataStore";
import Query from "./Query";
import ConnectionQuery from "./ConnectionQuery";
import Mutation from "./Mutation";
import type RestlayProvider from "./RestlayProvider";

/* eslint-disable no-use-before-define */

export type RestlayEnvironment = {|
  commitMutation: <In, Res>(m: Mutation<In, Res>) => Promise<Res>,
  fetchQuery: <In, Res>(m: Query<In, Res>) => Promise<Res>,
  forceFetch: () => Promise<void>,
  setVariables: Object => Promise<void>,
  getVariables: () => Object
  /* IDEA
  isReloadingData: (data: Object) => boolean,
  isOptimisticData: (data: Object) => boolean
  */
|};

type ConnectedProps = {|
  dataStore: Store,
  dispatch: Function
|};

type InjectedProps = {|
  restlay: RestlayEnvironment,
  reloading: boolean
|};

type ExtractQuery = <Q>(Class<Q>) => Q;
type ExtractQueryResult = <In, Out, O>(
  Class<Query<In, Out> | ConnectionQuery<In, O>>
) => Out;
type ExtractQueryIn = <In, Out>(
  Class<Query<In, Out> | ConnectionQuery<In, Out>>
) => In;

/* eslint-enable no-use-before-define */

// prettier-ignore
type InProps<Props, A> = $Supertype<InjectedProps & $ObjMap<A, ExtractQueryResult> & Props>;
type In<Props, A> =
  | Class<React$Component<InProps<Props, A>, any>>
  | ((props: InProps<Props, A>, ctx: any) => any);
// prettier-ignore
type Out<Props> = Class<React$Component<Props, any>>;

type ClazzProps<Props> = { ...ConnectedProps, ...Props };

export type ContextOverridableOpts<Props> = {
  // allow to implement the loading rendering. default is blank
  // prettier-ignore
  RenderLoading?: React$ComponentType<$Shape<{
    restlay: RestlayEnvironment
  } & Props>>,

  // allow to implement the error rendering. default is blank
  // prettier-ignore
  RenderError?: React$ComponentType<$Shape<{
    error: Error,
    restlay: RestlayEnvironment
  } & Props>>
};

type Opts<Props, A> = ContextOverridableOpts<Props> & {
  initialVariables?: Object,

  // an object of { [propName: string]: Class<Query|ConnectionQuery> }
  queries?: A,

  // allow to pass parameters to the api uri function that will be used to generate api URL.
  propsToQueryParams?: (
    props: Props,
    vars: Object
  ) => $Values<$ObjMap<A, ExtractQueryIn>>,

  // if a cached was defined on the Query, ignore it and make sure to reload the latest data
  forceFetch?: boolean,

  // allow the component to render if the api data was previously loaded in cache
  optimisticRendering?: boolean,

  // when new props changes the query params / new data refresh, don't render anything until it loads
  freezeTransition?: boolean,

  // when new data is reloading, always render again RenderLoading
  renderLoadingInTransition?: boolean // FIXME likely want to drop this and prefer the user to use `key` prop
};

const defaultOpts = {
  initialVariables: {},
  queries: {},
  RenderLoading: () => null,
  RenderError: () => null,
  propsToQueryParams: (_1, _2) => ({}),
  forceFetch: false,
  optimisticRendering: false,
  freezeTransition: false,
  renderLoadingInTransition: false
};

const extractInputProps = <Props>(props: ClazzProps<Props>): Props => {
  const { dataStore, dispatch, ...rest } = props; // eslint-disable-line no-unused-vars
  return rest;
};

const mapStateToProps = (state: Object): { dataStore: Store } => ({
  dataStore: state.data
});

export default function connectData<
  A: {
    [key: string]: Class<Query<any, any> | ConnectionQuery<any, any>>
  },
  Props: Object
>(Decorated: In<Props, A>, opts?: Opts<Props, A>): Out<Props> {
  type APIProps = $ObjMap<A, ExtractQueryResult>;

  const displayName = `connectData(${Decorated.displayName ||
    Decorated.name ||
    ""})`;

  // options that are not overridable by restlayProvider
  const {
    queries,
    propsToQueryParams,
    optimisticRendering,
    renderLoadingInTransition,
    freezeTransition,
    forceFetch,
    initialVariables
  } = {
    ...defaultOpts,
    ...opts
  };
  const queriesKeys: Array<$Keys<A>> = Object.keys(queries);

  type State = {
    catchedError: ?Error,
    apiError: ?Error,
    pending: boolean,
    data: ?APIProps,
    variables: Object
  };

  const sCUStateSubset = ({ pending, variables, ...rest }: State) => rest; // eslint-disable-line no-unused-vars

  class Clazz extends Component<ClazzProps<Props>, State> {
    context: {
      restlayProvider: RestlayProvider
    };

    static displayName = displayName;
    static contextTypes = {
      restlayProvider: PropTypes.object.isRequired
    };

    state = {
      // this holds the componentDidCatch errors
      catchedError: null,
      apiError: null,
      // we need to wait a potential initial sync to not render initially with previous data if optimisticRendering is not asked
      pending: false,
      data: null,
      variables: initialVariables
    };

    _options = {
      ...defaultOpts,
      ...this.context.restlayProvider.props.connectDataOptDefaults,
      ...opts
    };

    getOptions() {
      return this._options;
    }

    apiParams: ?Object = null;
    queriesInstances: ?$ObjMap<A, ExtractQuery>;
    _unmounted = false;

    setVariables = (vars: Object): Promise<void> => {
      const { variables } = this.state;
      let newVariables = { ...variables, ...vars };
      return this.syncProps(this.props, { variables: newVariables });
    };

    getVariables = () => this.state.variables;

    executeQueryF = executeQueryOrMutation(this.context.restlayProvider);

    execute<Out: *>(
      queryOrMutation:
        | Query<any, Out>
        | Mutation<any, Out>
        | ConnectionQuery<any, any>
    ): Promise<Out> {
      return this.props.dispatch(this.executeQueryF(queryOrMutation));
    }

    commitMutation = <Res>(m: Mutation<any, Res>): Promise<Res> => {
      return this.execute(m);
    };

    fetchQuery = <Res>(
      query: Query<any, Res> | ConnectionQuery<any, any>
    ): Promise<Res> => {
      return this.execute(query);
    };

    updateQueryInstances(apiParams: Object) {
      const instances: $ObjMap<A, ExtractQuery> = {};
      queriesKeys.forEach(key => {
        const Q = queries[key];
        // TODO : we might want to be more lazy with a "shouldQueryUpdate" or
        // something that would check if we really want to create a new instance.
        // for instance if query params changes but only concern one of the query
        const query: Query<*, *> | ConnectionQuery<*, *> = new Q(apiParams);
        instances[key] = query;
      });
      this.queriesInstances = instances;
      this.apiParams = apiParams;
    }

    syncAPI(
      apiParams: Object,
      props: ClazzProps<Props>,
      state: State,
      forceFetchMode: boolean = false
    ): Array<Promise<*>> {
      const { restlayProvider } = this.context;
      const { dataStore } = props;
      let queryUpdated = false;
      if (!isEqual(apiParams, this.apiParams) || !this.queriesInstances) {
        queryUpdated = true;
        this.updateQueryInstances(apiParams);
      }
      const queriesInstances = this.queriesInstances;
      invariant(queriesInstances, "queriesInstances must be defined");
      // $FlowFixMe filter() don't seem to be flowtyped correctly
      const promises: Array<Promise<*>> = queriesKeys
        .map(key => {
          const query = queriesInstances[key];
          const pendingQuery = restlayProvider.getPendingQuery(query);
          if (pendingQuery) return null; // If data is already pending we ignore calling fetchQuery again.
          let needsRefresh =
            forceFetch ||
            forceFetchMode ||
            (queryUpdated &&
              // FIXME later we might have a cache for ConnectionQuery actually,
              // not incompatible, just need to iterate step-by-step
              (query instanceof Query
                ? !queryCacheIsFresh(dataStore, query)
                : true));

          if (query instanceof ConnectionQuery) {
            const size = state.variables[key];
            if (typeof size !== "number") {
              throw new Error(
                "a variable '" + key + "' is expected on " + displayName
              );
            }
            if (!needsRefresh) {
              const cache = getPendingQueryResult(dataStore, query);
              needsRefresh =
                !cache ||
                (size !== cache.result.edges.length &&
                  cache.result.pageInfo.hasNextPage);
            }
            query.setSize(size);
          }

          if (needsRefresh) {
            return this.fetchQuery(query);
          }

          return null;
        })
        .filter(p => p);

      return promises;
    }

    syncAPI_id = 0;

    syncProps(
      props: ClazzProps<Props>,
      statePatch: $Shape<State> = {},
      forceFetchMode: boolean = false
    ): Promise<*> {
      // FIXME can we simplify the code?
      const state: State = { ...this.state, ...statePatch };
      const { dataStore } = props;

      const apiParams = propsToQueryParams(
        extractInputProps(props),
        state.variables
      );
      const promises = this.syncAPI(apiParams, props, state, forceFetchMode);

      let p: ?Promise<*>;
      if (promises.length > 0) {
        state.pending = true;
        state.apiError = null;
        const syncId = ++this.syncAPI_id;
        p = Promise.all(promises).then(
          () => {
            if (this._unmounted || syncId !== this.syncAPI_id) return;
            // we need to sync again to make sure data is in sync.
            // FIXME ^ really? after all tests are implemented, check again if we can't just do a setState with the patch
            // FIXME we need to change this probably so it avoid potential "infinite recursion" cases.
            // what we somehow want is to exec the second part of this function.. but need to be sure we are in sync with everything tho
            // NB we patch with a subset of state because local state variable might be outdated
            return this.syncProps(this.props, {
              apiError: null,
              pending: false
            });
          },
          apiError => {
            if (this._unmounted || syncId !== this.syncAPI_id) return;
            return this.setState({ apiError, pending: false });
          }
        );
      }

      const { queriesInstances } = this;
      const results = [];
      for (let key in queriesInstances) {
        const query = queriesInstances[key];
        const cache = getPendingQueryResult(dataStore, query);
        if (cache) {
          const { result } = cache;
          results.push({ result, key, query });
        }
      }

      if (results.length === queriesKeys.length) {
        if (!state.pending || optimisticRendering) {
          const newData: APIProps = {};
          let nbOfChanges = 0;
          results.forEach(({ query, result, key }) => {
            let item = query.getResponse(result, dataStore);
            // FIXME PERF: isEqual on data should not be required if we improve normalizr to keep references
            if (state.data && isEqual(item, state.data[key])) {
              // keep previous reference if deep equals
              item = state.data[key];
            } else {
              nbOfChanges++;
            }
            newData[key] = item;
          });
          if (nbOfChanges > 0) {
            // only set newData if it's actually new data^^
            state.catchedError = null;
            state.apiError = null;
            state.data = newData;
          }
        }
      }

      this.setState(state);
      return p || Promise.resolve();
    }

    componentWillMount() {
      this.syncProps(this.props);
    }

    componentWillUnmount() {
      this._unmounted = true;
    }

    componentWillReceiveProps(props: ClazzProps<Props>) {
      this.syncProps(props);
    }

    componentDidCatch(catchedError: Error) {
      this.setState({ catchedError });
    }

    shouldComponentUpdate(props: ClazzProps<Props>, state: State) {
      if (freezeTransition) {
        if (state.pending) return false;
      } else {
        if (state.pending !== this.state.pending) {
          return true;
        }
      }
      return (
        !shallowEqual(
          extractInputProps(this.props),
          extractInputProps(props)
        ) || !shallowEqual(sCUStateSubset(this.state), sCUStateSubset(state))
      );
    }

    // This "environment" is a restlay prop that will be passed to the component.
    // the idea is to put everything in an object to not pollute props and introduce new things over time
    restlay: RestlayEnvironment = {
      commitMutation: this.commitMutation,
      fetchQuery: this.fetchQuery,
      forceFetch: () => this.syncProps(this.props, {}, true).then(() => {}),
      getVariables: this.getVariables,
      setVariables: this.setVariables
    };

    render() {
      const { restlay } = this;
      const { data, apiError, catchedError, pending } = this.state;
      const props = extractInputProps(this.props);
      const error = catchedError || apiError;
      const { RenderError, RenderLoading } = this.getOptions();
      if (error) {
        // there is an error
        return <RenderError {...props} error={error} restlay={restlay} />;
      }
      if (
        (!data && queriesKeys.length > 0) || // there is no data yet (and we expect at least one data)
        (pending && renderLoadingInTransition) // it is reloading and we want to render loading again
      ) {
        return <RenderLoading {...props} restlay={restlay} />;
      }
      // all data is here and ready to render the Decorated component
      return (
        <Decorated {...props} {...data} reloading={pending} restlay={restlay} />
      );
    }
  }

  return connect(mapStateToProps)(Clazz);
}
