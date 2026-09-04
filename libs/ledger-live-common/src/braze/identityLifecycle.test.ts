import {
  runBrazeOptInTransition,
  runBrazeOptOutTransition,
  type BrazeIdentityLifecycleSdk,
} from "./identityLifecycle";

const USER_ID = "11111111-1111-1111-1111-111111111111";

function createSdk(
  overrides: Partial<jest.Mocked<BrazeIdentityLifecycleSdk>> = {},
): jest.Mocked<BrazeIdentityLifecycleSdk> {
  return {
    wipeData: jest.fn(),
    enableSDK: jest.fn(),
    changeUser: jest.fn(),
    refreshContentCards: jest.fn(),
    ...overrides,
  };
}

describe("runBrazeOptOutTransition", () => {
  it("should reset the SDK and refresh cards without identifying when opting out", async () => {
    const sdk = createSdk();

    await runBrazeOptOutTransition(sdk);

    expect(sdk.wipeData).toHaveBeenCalledTimes(1);
    expect(sdk.enableSDK).toHaveBeenCalledTimes(1);
    expect(sdk.refreshContentCards).toHaveBeenCalledTimes(1);
    expect(sdk.changeUser).not.toHaveBeenCalled();
    expect(sdk.wipeData.mock.invocationCallOrder[0]).toBeLessThan(
      sdk.enableSDK.mock.invocationCallOrder[0],
    );
    expect(sdk.enableSDK.mock.invocationCallOrder[0]).toBeLessThan(
      sdk.refreshContentCards.mock.invocationCallOrder[0],
    );
  });

  it("should not enable the SDK when wipeData fails", async () => {
    const sdk = createSdk({
      wipeData: jest.fn(async () => {
        throw new Error("wipe failed");
      }),
    });

    await expect(runBrazeOptOutTransition(sdk)).rejects.toThrow("wipe failed");
    expect(sdk.enableSDK).not.toHaveBeenCalled();
    expect(sdk.refreshContentCards).not.toHaveBeenCalled();
    expect(sdk.changeUser).not.toHaveBeenCalled();
  });

  it("should not refresh cards when enableSDK fails", async () => {
    const sdk = createSdk({
      enableSDK: jest.fn(async () => {
        throw new Error("enable failed");
      }),
    });

    await expect(runBrazeOptOutTransition(sdk)).rejects.toThrow("enable failed");
    expect(sdk.wipeData).toHaveBeenCalledTimes(1);
    expect(sdk.refreshContentCards).not.toHaveBeenCalled();
    expect(sdk.changeUser).not.toHaveBeenCalled();
  });
});

describe("runBrazeOptInTransition", () => {
  it("should identify after resetting the SDK when opting in", async () => {
    const sdk = createSdk();

    await runBrazeOptInTransition(sdk, { userId: USER_ID });

    expect(sdk.wipeData).toHaveBeenCalledTimes(1);
    expect(sdk.enableSDK).toHaveBeenCalledTimes(1);
    expect(sdk.changeUser).toHaveBeenCalledTimes(1);
    expect(sdk.changeUser).toHaveBeenCalledWith(USER_ID);
    expect(sdk.refreshContentCards).toHaveBeenCalledTimes(1);
    expect(sdk.wipeData.mock.invocationCallOrder[0]).toBeLessThan(
      sdk.enableSDK.mock.invocationCallOrder[0],
    );
    expect(sdk.enableSDK.mock.invocationCallOrder[0]).toBeLessThan(
      sdk.changeUser.mock.invocationCallOrder[0],
    );
    expect(sdk.changeUser.mock.invocationCallOrder[0]).toBeLessThan(
      sdk.refreshContentCards.mock.invocationCallOrder[0],
    );
  });

  it("should not call the SDK when the user id is missing", async () => {
    const sdk = createSdk();

    await expect(runBrazeOptInTransition(sdk, { userId: "" })).rejects.toThrow(
      "Braze opt-in transition requires a user id",
    );
    expect(sdk.wipeData).not.toHaveBeenCalled();
    expect(sdk.enableSDK).not.toHaveBeenCalled();
    expect(sdk.changeUser).not.toHaveBeenCalled();
    expect(sdk.refreshContentCards).not.toHaveBeenCalled();
  });

  it("should not identify when wipeData fails", async () => {
    const sdk = createSdk({
      wipeData: jest.fn(async () => {
        throw new Error("wipe failed");
      }),
    });

    await expect(runBrazeOptInTransition(sdk, { userId: USER_ID })).rejects.toThrow("wipe failed");
    expect(sdk.enableSDK).not.toHaveBeenCalled();
    expect(sdk.changeUser).not.toHaveBeenCalled();
    expect(sdk.refreshContentCards).not.toHaveBeenCalled();
  });

  it("should not refresh cards when changeUser fails", async () => {
    const sdk = createSdk({
      changeUser: jest.fn(async (_userId: string) => {
        throw new Error("changeUser failed");
      }),
    });

    await expect(runBrazeOptInTransition(sdk, { userId: USER_ID })).rejects.toThrow(
      "changeUser failed",
    );
    expect(sdk.wipeData).toHaveBeenCalledTimes(1);
    expect(sdk.enableSDK).toHaveBeenCalledTimes(1);
    expect(sdk.refreshContentCards).not.toHaveBeenCalled();
  });
});
