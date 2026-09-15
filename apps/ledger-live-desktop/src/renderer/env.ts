const dotEnvOverrides = {
  CARD_BAANX_API_URL: process.env.CARD_BAANX_API_URL,
  CARD_BAANX_CLIENT_KEY: process.env.CARD_BAANX_CLIENT_KEY,
  CARD_BAANX_HOSTED_UI: process.env.CARD_BAANX_HOSTED_UI,
  CARD_OAUTH_REDIRECT_URI: process.env.CARD_OAUTH_REDIRECT_URI,
};

const definedDotEnvOverrides = Object.fromEntries(
  Object.entries(dotEnvOverrides).filter(([, value]) => value !== undefined),
);

process.env = {
  ...process.env,
  ...definedDotEnvOverrides,
  NODE_ENV: (process.env || {}).NODE_ENV || "production",
};
