import { bindCtx } from "@ledgerhq/live-wallet/accounts";
import { renderHook, withFlagOverrides } from "@tests/test-renderer";
import { useLedgerSyncWatch } from "@features/platform-wallet-sync";
import { simpleTrustChain } from "./shared";

jest.mock("@ledgerhq/live-wallet/accounts", () => {
  const actual = jest.requireActual("@ledgerhq/live-wallet/accounts");
  return { ...actual, bindCtx: jest.fn(actual.bindCtx) };
});

const ACTIVATED_STATE = withFlagOverrides(
  {
    llmWalletSync: {
      enabled: true,
      params: {
        environment: "STAGING",
        watchConfig: {},
      },
    },
  },
  state => ({
    ...state,
    trustchain: {
      trustchain: simpleTrustChain,
      memberCredentials: {
        pubkey: "currentInstance",
        privatekey: "privatekey",
      },
    },
  }),
);

describe("createLiveWalletsync", () => {
  it("should bind the accounts sync module with the user's blacklisted token ids", () => {
    const blacklistedTokenIds = ["ethereum/erc20/usd_tether__erc20_"];
    jest.mocked(bindCtx).mockClear();

    renderHook(() => useLedgerSyncWatch(), {
      overrideInitialState: state => {
        const base = ACTIVATED_STATE(state);
        return { ...base, settings: { ...base.settings, blacklistedTokenIds } };
      },
    });

    expect(bindCtx).toHaveBeenCalledWith(expect.objectContaining({ blacklistedTokenIds }));
  });
});
