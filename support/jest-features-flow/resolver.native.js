const NATIVE_FEATURE_PACKAGE_PATTERN = /^@(features|shared)\//;

module.exports = (request, options) => {
  const conditions = NATIVE_FEATURE_PACKAGE_PATTERN.test(request)
    ? ["react-native", ...(options.conditions ?? [])]
    : options.conditions;

  return options.defaultResolver(request, { ...options, conditions });
};
