const dotEnvOverrides = Object.fromEntries(
  Object.entries({
    CARD_BAANX_LOGIN_MANIFEST_ID: process.env.CARD_BAANX_LOGIN_MANIFEST_ID,
    CARD_BAANX_HOSTED_MANIFEST_ID: process.env.CARD_BAANX_HOSTED_MANIFEST_ID,
  }).filter(([, value]) => value !== undefined),
);

process.env = {
  ...process.env,
  ...dotEnvOverrides,
  NODE_ENV: (process.env || {}).NODE_ENV || "production",
};
