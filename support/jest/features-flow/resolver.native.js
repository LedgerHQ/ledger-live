// @ts-check

const NATIVE_WORKSPACE_PACKAGE_PATTERN = /^@(features|shared)\//;

/**
 * Jest custom resolver for the features-flow native project: workspace packages under
 * `@features/*` and `@shared/*` resolve with the `react-native` export condition first.
 *
 * @param {string} request
 * @param {import("jest-resolve").ResolverOptions} options
 * @returns {string}
 */
export default (request, options) => {
  const conditions = NATIVE_WORKSPACE_PACKAGE_PATTERN.test(request)
    ? ["react-native", ...(options.conditions ?? [])]
    : options.conditions;

  return options.defaultResolver(request, { ...options, conditions });
};
