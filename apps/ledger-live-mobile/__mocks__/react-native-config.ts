// Mirror runtime: env vars are strings when set. E2E_BRIDGE/DETOX undefined = disabled (use "1" in E2E test env).
// Use undefined so (1) E2E_BRIDGE_ENABLED stays false and (2) truthiness checks (Config.E2E_BRIDGE / Config.DETOX) are falsy in unit tests.
// MOCK: false so isDatadogEnabled can be true in tests when token fields are set.
export default {
  DEVICE_PROXY_URL: null,
  ANALYTICS_TOKEN: "test-token",
  ANALYTICS_LOGS: "false",
  DATADOG_CLIENT_TOKEN_VAR: "DATADOG_CLIENT_TOKEN_VAR",
  DATADOG_APPLICATION_ID_VAR: "DATADOG_APPLICATION_ID_VAR",
  DD_CLIENT_TOKEN: "DD_CLIENT_TOKEN",
  DD_APP_ID: "DD_APP_ID",
  MOCK: false,
  DETOX: undefined,
  E2E_BRIDGE: undefined,
};
