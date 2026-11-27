import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { estimateSolanaStakeDepositMax } from "@ledgerhq/live-common/families/solana/stakeDepositEstimate";
import { connectLiveApp } from "@ledgerhq/live-common/test-helpers/walletApiServer";
import {
  getWalletApiIdFromAccountId,
  setWalletApiIdForAccountId,
} from "@ledgerhq/live-common/wallet-api/converters";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { renderHookWithLiveAppProvider } from "tests/testSetup";
import { usePTXCustomHandlers } from "../CustomHandlers";

jest.mock("@ledgerhq/live-common/families/solana/stakeDepositEstimate", () => ({
  ...jest.requireActual("@ledgerhq/live-common/families/solana/stakeDepositEstimate"),
  estimateSolanaStakeDepositMax: jest.fn(),
}));

const METHOD = "custom.stake.deposit.estimate";

const earnManifest: LiveAppManifest = {
  id: "earn",
  name: "Earn",
  url: "https://earn.example",
  homepageUrl: "https://earn.example",
  apiVersion: "^2.0.0",
  manifestVersion: "2",
  branch: "stable",
  platforms: ["desktop"],
  domains: ["https://*"],
  visibility: "complete",
  categories: ["earn"],
  currencies: "*",
  permissions: [METHOD],
  content: { shortDescription: { en: "Earn" }, description: { en: "Earn" } },
};

const solanaAccount = genAccount("stake-deposit", {
  currency: getCryptoCurrencyById("solana"),
  operationsSize: 0,
  subAccountsCount: 0,
});
const ethereumAccount = genAccount("stake-deposit-eth", {
  currency: getCryptoCurrencyById("ethereum"),
  operationsSize: 0,
  subAccountsCount: 0,
});

function walletIdOf(accountId: string): string {
  setWalletApiIdForAccountId(accountId);
  return getWalletApiIdFromAccountId(accountId);
}

/** The desktop handlers of the Earn player, called as the live app calls them. */
function connectEarnApp(permissions: string[]) {
  const { result } = renderHookWithLiveAppProvider(() =>
    usePTXCustomHandlers(earnManifest, [solanaAccount, ethereumAccount]),
  );
  const liveApp = connectLiveApp(result.current, permissions);
  return {
    handlers: result.current,
    call: (params: unknown) => liveApp.call(METHOD, params),
  };
}

describe("usePTXCustomHandlers custom.stake.deposit.estimate", () => {
  beforeEach(() => {
    jest.mocked(estimateSolanaStakeDepositMax).mockReset();
  });

  it("is one of the handlers of the Earn player", () => {
    const { handlers } = connectEarnApp([METHOD]);

    expect(Object.keys(handlers)).toContain(METHOD);
  });

  it("answers the host maximum of a Solana account of the wallet, in lamports", async () => {
    jest.mocked(estimateSolanaStakeDepositMax).mockResolvedValue(new BigNumber("9997696120"));
    const { call } = connectEarnApp([METHOD]);

    const response = await call({ accountId: walletIdOf(solanaAccount.id) });

    expect(response.result).toEqual({ maxAmount: "9997696120" });
    expect(estimateSolanaStakeDepositMax).toHaveBeenCalledWith(solanaAccount);
  });

  it("rejects an account of another currency, without an estimate", async () => {
    const { call } = connectEarnApp([METHOD]);

    const response = await call({ accountId: walletIdOf(ethereumAccount.id) });

    expect(response.error).toBeDefined();
    expect(response.result).toBeUndefined();
    expect(estimateSolanaStakeDepositMax).not.toHaveBeenCalled();
  });

  it("rejects an id that is not one of the accounts of the wallet", async () => {
    const { call } = connectEarnApp([METHOD]);

    const response = await call({ accountId: walletIdOf("js:2:solana:not-in-the-wallet:") });

    expect(response.error?.data).toMatchObject({ code: "ACCOUNT_NOT_FOUND" });
    expect(estimateSolanaStakeDepositMax).not.toHaveBeenCalled();
  });

  it("is refused by the server when the manifest has no permission for it", async () => {
    const { call } = connectEarnApp(["custom.getFunds"]);

    const response = await call({ accountId: walletIdOf(solanaAccount.id) });

    expect(response.error?.data).toMatchObject({ code: "PERMISSION_DENIED" });
    expect(estimateSolanaStakeDepositMax).not.toHaveBeenCalled();
  });
});
