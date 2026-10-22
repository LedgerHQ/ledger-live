export type RouteLike = Readonly<{
  key?: string;
  name?: string;
  params?: object;
  state?: StateLike;
}>;

type StateLike = Readonly<{ index?: number; routes: readonly RouteLike[] }>;

function getFocusedLeaf(route: RouteLike): RouteLike {
  const nested = route.state;
  if (!nested?.routes.length) return route;
  return getFocusedLeaf(nested.routes[nested.index ?? nested.routes.length - 1]);
}

export function countRoutesBackTo(
  state: StateLike,
  routeKey: string,
  isTarget: (route: RouteLike) => boolean,
): number | undefined {
  const index = state.routes.findIndex(route => route.key === routeKey);
  if (index >= 0) {
    for (let previous = index - 1; previous >= 0; previous--) {
      if (isTarget(getFocusedLeaf(state.routes[previous]))) return index - previous;
    }
    return undefined;
  }
  for (const route of state.routes) {
    if (!route.state) continue;
    const count = countRoutesBackTo(route.state, routeKey, isTarget);
    if (count !== undefined) return count;
  }
  return undefined;
}
