const HOME_VIEW_NAME = "portfolio";
const UNKNOWN_VIEW_NAME = "other";
const STATIC_ROUTE_SEGMENT = /^[A-Za-z][A-Za-z-]{0,39}$/;

export function toDatadogViewName(routePath: string): string {
  const [pathname] = routePath.split(/[?#]/);
  const firstSegment = pathname.split("/").find(segment => segment.length > 0);
  if (!firstSegment) return HOME_VIEW_NAME;
  return STATIC_ROUTE_SEGMENT.test(firstSegment) ? firstSegment : UNKNOWN_VIEW_NAME;
}
