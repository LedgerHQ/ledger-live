const NATIVE_WORKSPACE_PACKAGE_PATTERN = /^@(features|shared)\//;

export default (request, options) => {
  const conditions = NATIVE_WORKSPACE_PACKAGE_PATTERN.test(request)
    ? ["react-native", ...(options.conditions ?? [])]
    : options.conditions;

  return options.defaultResolver(request, { ...options, conditions });
};
