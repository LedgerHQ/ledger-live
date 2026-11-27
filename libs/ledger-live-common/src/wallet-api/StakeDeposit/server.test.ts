import BigNumber from "bignumber.js";
import { log } from "@ledgerhq/logs";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { AccountLike } from "@ledgerhq/types-live";
import {
  createFixtureAccount,
  createFixtureTokenAccount,
} from "../../mock/fixtures/cryptoCurrencies";
import {
  estimateSolanaStakeDepositMax,
  SolanaStakeDepositEstimateError,
} from "../../families/solana/stakeDepositEstimate";
import { connectLiveApp } from "../../test-helpers/walletApiServer";
import { getWalletApiIdFromAccountId, setWalletApiIdForAccountId } from "../converters";
import { handlers } from "./server";

jest.mock("@ledgerhq/logs", () => ({ log: jest.fn() }));
jest.mock("../../families/solana/stakeDepositEstimate", () => ({
  ...jest.requireActual("../../families/solana/stakeDepositEstimate"),
  estimateSolanaStakeDepositMax: jest.fn(),
}));

const METHOD = "custom.stake.deposit.estimate";
const mockEstimate = jest.mocked(estimateSolanaStakeDepositMax);

const solanaAccount = createFixtureAccount("sol", getCryptoCurrencyById("solana"));
const ethereumAccount = createFixtureAccount("eth", getCryptoCurrencyById("ethereum"));
const solanaTokenAccount = { ...createFixtureTokenAccount("sol"), parentId: solanaAccount.id };
const accounts: AccountLike[] = [solanaAccount, ethereumAccount, solanaTokenAccount];

function walletIdOf(account: AccountLike): string {
  setWalletApiIdForAccountId(account.id);
  return getWalletApiIdFromAccountId(account.id);
}

/** The Earn live app, connected with the permissions its manifest grants. */
function startServer(methodIds: string[]) {
  const liveApp = connectLiveApp(handlers({ accounts }), methodIds);
  return { call: (params?: unknown) => liveApp.call(METHOD, params) };
}

describe("custom.stake.deposit.estimate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("answers", () => {
    it("the maximum in lamports, as a string of digits", async () => {
      mockEstimate.mockResolvedValue(new BigNumber("9997696120"));
      const { call } = startServer([METHOD]);

      const response = await call({ accountId: walletIdOf(solanaAccount) });

      expect(response.result).toEqual({ maxAmount: "9997696120" });
      expect(mockEstimate).toHaveBeenCalledWith(solanaAccount);
    });

    it.each([
      ["zero", new BigNumber(0), "0"],
      ["one lamport", new BigNumber(1), "1"],
      [
        "the whole supply of SOL, with no exponent",
        new BigNumber("600000000000000000"),
        "600000000000000000",
      ],
    ])("%s", async (_name, quote, expected) => {
      mockEstimate.mockResolvedValue(quote);
      const { call } = startServer([METHOD]);

      const response = await call({ accountId: walletIdOf(solanaAccount) });

      expect(response.result).toEqual({ maxAmount: expected });
      expect(response.result).toEqual({ maxAmount: expect.stringMatching(/^\d+$/) });
    });
  });

  describe("rejects, and never asks the estimate", () => {
    it("when the manifest does not grant the permission", async () => {
      const { call } = startServer(["custom.getFunds", "account.list"]);

      const response = await call({ accountId: walletIdOf(solanaAccount) });

      expect(response.error?.data).toMatchObject({ code: "PERMISSION_DENIED" });
      expect(response.result).toBeUndefined();
      expect(mockEstimate).not.toHaveBeenCalled();
    });

    it("an id that the live app was never given", async () => {
      const { call } = startServer([METHOD]);

      const response = await call({ accountId: "c1b0f66e-0000-4000-8000-000000000000" });

      expect(response.error?.data).toMatchObject({ code: "ACCOUNT_NOT_FOUND" });
      expect(mockEstimate).not.toHaveBeenCalled();
    });

    it("an id that no account of the wallet carries any more", async () => {
      const removed = createFixtureAccount("removed", getCryptoCurrencyById("solana"));
      const { call } = startServer([METHOD]);

      const response = await call({ accountId: walletIdOf(removed) });

      expect(response.error?.data).toMatchObject({ code: "ACCOUNT_NOT_FOUND" });
      expect(mockEstimate).not.toHaveBeenCalled();
    });

    it.each([
      ["an account of another currency", ethereumAccount],
      ["a token account, even of a Solana main account", solanaTokenAccount],
    ])("%s", async (_name, account) => {
      const { call } = startServer([METHOD]);

      const response = await call({ accountId: walletIdOf(account) });

      expect(response.error).toBeDefined();
      expect(JSON.stringify(response.error)).toContain("Solana main account");
      expect(mockEstimate).not.toHaveBeenCalled();
    });

    it("a request without params, before it reaches the handler", async () => {
      const { call } = startServer([METHOD]);

      const response = await call(undefined);

      expect(response.error).toBeDefined();
      expect(response.result).toBeUndefined();
      expect(mockEstimate).not.toHaveBeenCalled();
    });

    it.each([
      ["params without an account id", {}],
      ["an empty account id", { accountId: "" }],
      ["an account id that is not a string", { accountId: 42 }],
      ["params that are a bare id", "some-id"],
    ])("%s", async (_name, params) => {
      const { call } = startServer([METHOD]);

      const response = await call(params);

      expect(response.error).toBeDefined();
      expect(JSON.stringify(response.error)).toContain("invalid params");
      expect(mockEstimate).not.toHaveBeenCalled();
    });
  });

  describe("fails closed when the estimate is unavailable", () => {
    it("with the reason of the failure and nothing else about it", async () => {
      mockEstimate.mockRejectedValue(
        new SolanaStakeDepositEstimateError("unstake_reserve_unavailable"),
      );
      const { call } = startServer([METHOD]);

      const response = await call({ accountId: walletIdOf(solanaAccount) });

      expect(response.result).toBeUndefined();
      expect(JSON.stringify(response.error)).toContain("unstake_reserve_unavailable");
      expect(log).toHaveBeenCalledWith("stake-deposit-estimate", expect.any(String), {
        reason: "unstake_reserve_unavailable",
      });
    });

    it("without carrying the message of an RPC failure to the live app or to the log", async () => {
      const secret = `${solanaAccount.freshAddress}@https://rpc.example/key-1234`;
      mockEstimate.mockRejectedValue(new Error(`getBalance failed for ${secret}`));
      const { call } = startServer([METHOD]);

      const response = await call({ accountId: walletIdOf(solanaAccount) });

      expect(JSON.stringify(response)).not.toContain("key-1234");
      expect(JSON.stringify(response)).toContain("estimation_failed");
      expect(JSON.stringify(jest.mocked(log).mock.calls)).not.toContain("key-1234");
    });

    it("whatever the thrown value is", async () => {
      mockEstimate.mockRejectedValue("not an error");
      const { call } = startServer([METHOD]);

      const response = await call({ accountId: walletIdOf(solanaAccount) });

      expect(response.result).toBeUndefined();
      expect(JSON.stringify(response.error)).toContain("estimation_failed");
    });
  });
});
