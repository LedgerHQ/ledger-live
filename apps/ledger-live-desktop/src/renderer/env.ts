process.env = {
  // Build-time values first: a real runtime env var still overrides them.
  ...__BUILD_ENVS__,
  ...process.env,
  NODE_ENV: (process.env || {}).NODE_ENV || "production",
};
