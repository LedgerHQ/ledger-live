import { authApiExtra } from "./api";

const EXPECTED_TOKEN = { accessToken: "foo", tokenType: "Bearer" };

describe("authApiExtra", () => {
  let authEnabled = false;
  const isFeatureEnabled = jest.fn(() => authEnabled);
  const withToken = jest.fn(({ queryFn }) => queryFn(EXPECTED_TOKEN));
  const queryFn = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    authEnabled = false;
  });

  it("should bypass authentication when the feature is disabled", async () => {
    const { authProvider } = authApiExtra({
      isFeatureEnabled,
      authProvider: { withToken },
    });

    await authProvider.withToken({ queryFn });

    expect(isFeatureEnabled).toHaveBeenCalledTimes(1);
    expect(withToken).not.toHaveBeenCalled();
    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(queryFn).toHaveBeenNthCalledWith(1);
  });

  it("should delegate authentication when the feature is enabled", async () => {
    authEnabled = true;
    const { authProvider } = authApiExtra({
      isFeatureEnabled,
      authProvider: { withToken },
    });

    await authProvider.withToken({ queryFn });

    expect(isFeatureEnabled).toHaveBeenCalledTimes(1);
    expect(withToken).toHaveBeenCalledTimes(1);
    expect(queryFn).toHaveBeenCalledWith(EXPECTED_TOKEN);
  });

  it("should reevaluate the feature before every authentication", async () => {
    const { authProvider } = authApiExtra({
      isFeatureEnabled,
      authProvider: { withToken },
    });

    await authProvider.withToken({ queryFn });
    authEnabled = true;
    await authProvider.withToken({ queryFn });
    authEnabled = false;
    await authProvider.withToken({ queryFn });

    expect(isFeatureEnabled).toHaveBeenCalledTimes(3);
    expect(withToken).toHaveBeenCalledTimes(1);
    expect(queryFn).toHaveBeenNthCalledWith(1);
    expect(queryFn).toHaveBeenNthCalledWith(2, EXPECTED_TOKEN);
    expect(queryFn).toHaveBeenNthCalledWith(3);
  });
});
