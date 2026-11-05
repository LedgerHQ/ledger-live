import type { ResolverOptions } from "jest-resolve";

const NATIVE_WORKSPACE_PACKAGE_PATTERN = /^@(features|shared)\//;

/**
 * Jest custom resolver for the features-flow native project: workspace packages under
 * `@features/*` and `@shared/*` resolve with the `react-native` export condition first.
 */
export default (request: string, options: ResolverOptions): string => {
  const conditions = NATIVE_WORKSPACE_PACKAGE_PATTERN.test(request)
    ? ["react-native", ...(options.conditions ?? [])]
    : options.conditions;

  return options.defaultResolver(request, { ...options, conditions });
};
