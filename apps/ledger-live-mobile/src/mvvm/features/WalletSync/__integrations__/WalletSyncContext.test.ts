import { bindCtx } from "@ledgerhq/live-wallet/accounts";
import { renderHook, withFlagOverrides } from "@tests/test-renderer";
import { WalletSyncProvider, useWalletSyncUserState } from "../components/WalletSyncContext";
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

describe("WalletSyncContext", () => {
  it("should bind the accounts sync module with the user's blacklisted token ids", () => {
    const blacklistedTokenIds = ["ethereum/erc20/usd_tether__erc20_"];
    jest.mocked(bindCtx).mockClear();

    renderHook(() => useWalletSyncUserState(), {
      overrideInitialState: state => {
        const base = ACTIVATED_STATE(state);
        return { ...base, settings: { ...base.settings, blacklistedTokenIds } };
      },
      innerWrapper: WalletSyncProvider,
    });

    expect(bindCtx).toHaveBeenCalledWith(expect.objectContaining({ blacklistedTokenIds }));
  });
});
