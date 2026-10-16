type RouteLike = Readonly<{
  key?: string;
  params?: object;
  state?: NavigatorStateLike;
}>;

export type NavigatorStateLike = Readonly<{
  type?: string;
  index?: number;
  routes: readonly RouteLike[];
}>;

type ParamsLike = {
  accountId?: unknown;
  parentId?: unknown;
  screen?: unknown;
  params?: ParamsLike;
};

function ownParamsAreAboutAccount(params: ParamsLike | undefined, accountId: string): boolean {
  return params?.accountId === accountId || params?.parentId === accountId;
}

function nestedParamsAreAboutAccount(params: ParamsLike | undefined, accountId: string): boolean {
  if (!params?.params) return false;
  return (
    ownParamsAreAboutAccount(params.params, accountId) ||
    nestedParamsAreAboutAccount(params.params, accountId)
  );
}

function withoutNestedTarget(params: ParamsLike | undefined): object | undefined {
  if (!params) return undefined;
  const { screen: _screen, params: _params, ...rest } = params;
  return Object.keys(rest).length ? rest : undefined;
}

function pruneRoute(route: RouteLike, accountId: string): RouteLike | undefined {
  const params = route.params as ParamsLike | undefined;
  if (ownParamsAreAboutAccount(params, accountId)) return undefined;
  if (!route.state) return nestedParamsAreAboutAccount(params, accountId) ? undefined : route;

  const state = pruneAccountRoutes(route.state, accountId);
  if (!state) return undefined;
  const hasObsoleteTarget = nestedParamsAreAboutAccount(params, accountId);
  if (state === route.state && !hasObsoleteTarget) return route;
  return {
    ...route,
    state,
    params: hasObsoleteTarget ? withoutNestedTarget(params) : route.params,
  };
}

export function pruneAccountRoutes<State extends NavigatorStateLike>(
  state: State,
  accountId: string,
): State | undefined {
  const routes = state.routes
    .map(route => pruneRoute(route, accountId))
    .filter((route): route is RouteLike => route !== undefined);

  const isUnchanged =
    routes.length === state.routes.length &&
    routes.every((route, index) => route === state.routes[index]);
  if (isUnchanged) return state;
  if (routes.length === 0) return undefined;

  const index =
    state.type === "tab" ? Math.min(state.index ?? 0, routes.length - 1) : routes.length - 1;
  return { ...state, routes, index };
}
