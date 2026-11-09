/**
 * @jest-environment jsdom
 */
import { bindCtx } from "@ledgerhq/live-wallet/accounts";
import { renderHook, withFlagOverrides } from "tests/testSetup";
import { useLedgerSyncWatch } from "@features/platform-wallet-sync";
import { lldWalletSyncFeatureFlag, simpleTrustChain } from "./shared";

jest.mock("@ledgerhq/live-wallet/accounts", () => {
  const actual = jest.requireActual("@ledgerhq/live-wallet/accounts");
  return { ...actual, bindCtx: jest.fn(actual.bindCtx) };
});

const ACTIVATED_STATE = {
  trustchain: {
    trustchain: simpleTrustChain,
    memberCredentials: { pubkey: "currentInstance", privatekey: "privatekey" },
  },
  ...withFlagOverrides(lldWalletSyncFeatureFlag),
};

describe("createLiveWalletsync", () => {
  it("should bind the accounts sync module with the user's blacklisted token ids", () => {
    const blacklistedTokenIds = ["ethereum/erc20/usd_tether__erc20_"];
    jest.mocked(bindCtx).mockClear();

    renderHook(() => useLedgerSyncWatch(), {
      initialState: { ...ACTIVATED_STATE, settings: { blacklistedTokenIds } },
    });

    expect(bindCtx).toHaveBeenCalledWith(expect.objectContaining({ blacklistedTokenIds }));
  });
});
