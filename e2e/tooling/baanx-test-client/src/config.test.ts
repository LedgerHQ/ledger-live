import { RFC6238_SECRET } from "./__mocks__/fetchMock";
import { ENV_VARS, resolveBaanxAuthConfig } from "./config";
import { DEFAULT_BAANX_BASE_URL } from "./types";

describe("resolveBaanxAuthConfig", () => {
  it("reads everything from the environment and defaults the rest", () => {
    const config = resolveBaanxAuthConfig(
      {},
      {
        [ENV_VARS.clientKey]: "env-client-key",
        [ENV_VARS.email]: "env@ledger.test",
        [ENV_VARS.password]: "env-password",
        [ENV_VARS.totpSecret]: RFC6238_SECRET,
      },
    );

    expect(config).toEqual({
      baseUrl: DEFAULT_BAANX_BASE_URL,
      clientKey: "env-client-key",
      email: "env@ledger.test",
      password: "env-password",
      region: "international",
      totp: { secret: RFC6238_SECRET, digits: 6, period: 30, algorithm: "SHA1" },
    });
  });

  it("treats an empty BAANX_TEST_API_URL as unset and uses the default base URL", () => {
    const config = resolveBaanxAuthConfig(
      {},
      {
        [ENV_VARS.clientKey]: "env-client-key",
        [ENV_VARS.email]: "env@ledger.test",
        [ENV_VARS.password]: "env-password",
        [ENV_VARS.totpSecret]: RFC6238_SECRET,
        [ENV_VARS.baseUrl]: "",
      },
    );

    expect(config.baseUrl).toBe(DEFAULT_BAANX_BASE_URL);
  });
});
