/**
 * Helper to extract screen params from nested navigation structure
 */
export function extractScreenParams<T>(routeParams: unknown): T | undefined {
  return (routeParams as { params?: T })?.params;
}

/**
 * Helper to extract specific param from nested navigation structure
 */
export function extractParam<T>(routeParams: unknown, paramName: string): T | undefined {
  return (routeParams as { params?: Record<string, T> })?.params?.[paramName];
}
