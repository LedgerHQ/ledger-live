import { getSdk } from "@ledgerhq/ledger-key-ring-protocol/index";
import { getWalletSyncEnvironmentParams } from "@features/platform-wallet-sync";
import { renderHook } from "@tests/test-renderer";
import { useTrustchainSdk } from "../hooks/useTrustchainSdk";

jest.mock("@ledgerhq/ledger-key-ring-protocol/index", () => ({
  ...jest.requireActual("@ledgerhq/ledger-key-ring-protocol/index"),
  getSdk: jest.fn(),
}));

jest.mock("~/config/walletSync", () => ({
  walletSyncEnvironment: "STAGING",
}));

jest.mock("../hooks/useInstanceName", () => ({
  useInstanceName: () => "Mobile instance",
}));

describe("useTrustchainSdk", () => {
  it("uses walletSyncEnvironment", () => {
    const sdk = {} as ReturnType<typeof getSdk>;
    jest.mocked(getSdk).mockReturnValue(sdk);

    const { result } = renderHook(() => useTrustchainSdk());

    expect(result.current).toBe(sdk);
    expect(jest.mocked(getSdk)).toHaveBeenCalledWith(
      expect.any(Boolean),
      expect.objectContaining({
        apiBaseUrl: getWalletSyncEnvironmentParams("STAGING").trustchainApiBaseUrl,
      }),
      expect.any(Function),
    );
    expect(getSdk).toHaveBeenCalledTimes(1);
  });
});
