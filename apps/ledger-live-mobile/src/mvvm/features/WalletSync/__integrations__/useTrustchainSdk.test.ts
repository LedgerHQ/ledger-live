import { getSdk } from "@ledgerhq/ledger-key-ring-protocol/index";
import { renderHook, withFlagOverrides } from "@tests/test-renderer";
import { useTrustchainSdk } from "../hooks/useTrustchainSdk";

jest.mock("@ledgerhq/ledger-key-ring-protocol/index", () => ({
  ...jest.requireActual("@ledgerhq/ledger-key-ring-protocol/index"),
  getSdk: jest.fn(),
}));

jest.mock("../hooks/useInstanceName", () => ({
  useInstanceName: () => "Mobile instance",
}));

describe("useTrustchainSdk", () => {
  it("publishes the environment captured by the Trustchain SDK", () => {
    const sdk = {} as ReturnType<typeof getSdk>;
    jest.mocked(getSdk).mockReturnValue(sdk);

    const { result, store } = renderHook(() => useTrustchainSdk(), {
      overrideInitialState: withFlagOverrides({
        llmWalletSync: {
          enabled: true,
          params: {
            environment: "STAGING",
            watchConfig: {},
            learnMoreLink: "",
          },
        },
      }),
    });

    expect(result.current).toBe(sdk);
    expect(jest.mocked(getSdk)).toHaveBeenCalledWith(
      expect.any(Boolean),
      expect.not.objectContaining({ environment: expect.anything() }),
      expect.any(Function),
    );
    expect(store.getState().authEnvironment).toBe("STAGING");
    expect(getSdk).toHaveBeenCalledTimes(1);
  });
});
