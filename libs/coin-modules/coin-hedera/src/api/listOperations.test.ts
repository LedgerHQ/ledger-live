import { setupMockCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { encodeTokenAccountId } from "@ledgerhq/ledger-wallet-framework/account/accountId";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import BigNumber from "bignumber.js";
import { apiClient } from "../network/api";
import { hgraphClient } from "../network/hgraph";
import * as networkUtils from "../network/utils";
import { getMockedConfig } from "../test/fixtures/config.fixture";
import { getMockedCurrency } from "../test/fixtures/currency.fixture";
import { getMockedMirrorTransaction } from "../test/fixtures/mirror.fixture";
import * as logicUtils from "../logic/utils";
import { createApi } from "./index";

// Exercises the real pipeline end-to-end (real `listOperationsV2` + real
// `getOperationValue`), mocking only the network boundary.
setupMockCryptoAssetsStore();

jest.mock("@ledgerhq/ledger-wallet-framework/account/accountId", () => ({
  ...jest.requireActual("@ledgerhq/ledger-wallet-framework/account/accountId"),
  encodeTokenAccountId: jest.fn(),
}));
jest.mock("@ledgerhq/ledger-wallet-framework/operation");
jest.mock("../network/api");
jest.mock("../network/hgraph");
jest.mock("../network/utils", () => ({
  ...jest.requireActual("../network/utils"),
  toEVMAddress: jest.fn(),
  getERC20BalancesForAccountV2: jest.fn(),
  enrichERC20Transfers: jest.fn(),
  analyzeStakingOperation: jest.fn(),
}));
jest.mock("../logic/utils", () => ({
  ...jest.requireActual("../logic/utils"),
  base64ToUrlSafeBase64: jest.fn().mockImplementation(hash => `encoded-${hash}`),
  getMemoFromBase64: jest.fn().mockImplementation(memo => (memo ? `decoded-${memo}` : null)),
  getSyntheticBlock: jest.fn(),
  extractFeesPayer: jest.fn(),
}));

describe("createApi().listOperations - fee-exclusive API surface", () => {
  const currencyId = getMockedCurrency().id;
  const api = createApi(getMockedConfig(), currencyId);

  const payer = "0.0.8835924";
  const usdc = "0.0.456858";
  const hbark = "0.0.5022567";
  const r1 = "0.0.9124531";
  const r2 = "0.0.9169746";
  const fee = 1176695;

  beforeEach(() => {
    jest.clearAllMocks();

    (networkUtils.toEVMAddress as jest.Mock).mockResolvedValue(
      "0x0000000000000000000000000000000000000001",
    );
    (networkUtils.getERC20BalancesForAccountV2 as jest.Mock).mockResolvedValue([]);
    (networkUtils.enrichERC20Transfers as jest.Mock).mockResolvedValue([]);
    (networkUtils.analyzeStakingOperation as jest.Mock).mockResolvedValue(null);
    (apiClient.getAccountTokens as jest.Mock).mockResolvedValue([]);
    (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
      transactions: [],
      nextCursor: null,
    });
    (hgraphClient.getERC20Transfers as jest.Mock).mockResolvedValue([]);
    (hgraphClient.getLatestIndexedConsensusTimestamp as jest.Mock).mockResolvedValue(
      new BigNumber(0),
    );
    (encodeOperationId as jest.Mock).mockImplementation(
      (accountId, hash, type) => `${accountId}-${hash}-${type}`,
    );
    (encodeTokenAccountId as jest.Mock).mockImplementation(
      (accountId, token) => `${accountId}-${token.id}`,
    );
    (logicUtils.getSyntheticBlock as jest.Mock).mockReturnValue({
      blockHeight: 176051087,
      blockHash: "0xsynthetic",
      blockTime: new Date("2025-10-15T00:00:00Z"),
    });
    (logicUtils.extractFeesPayer as jest.Mock).mockReturnValue(payer);
    // keep the token off CAL so it takes the raw HTS path (deterministic, no lookup)
    setupMockCryptoAssetsStore({
      findTokenByAddressInCurrency: jest.fn().mockResolvedValue(null),
    });
  });

  describe("multi-asset CryptoTransfer", () => {
    let items: Awaited<ReturnType<typeof api.listOperations>>["items"];

    beforeEach(async () => {
      (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
        transactions: [
          getMockedMirrorTransaction({
            consensus_timestamp: "1760510879.300860000",
            transaction_id: `${payer}-1760510879-300860000`,
            transaction_hash: "multiasset",
            charged_tx_fee: fee,
            result: "SUCCESS",
            name: "CRYPTOTRANSFER",
            staking_reward_transfers: [],
            transfers: [
              { account: payer, amount: -(2000000 + fee) },
              { account: r1, amount: 1000000 },
              { account: r2, amount: 1000000 },
              { account: "0.0.802", amount: fee },
            ],
            token_transfers: [
              { token_id: usdc, account: payer, amount: -10000 },
              { token_id: usdc, account: r1, amount: 10000 },
              { token_id: hbark, account: payer, amount: -2 },
              { token_id: hbark, account: r2, amount: 2 },
            ],
          }),
        ],
        nextCursor: null,
      });

      ({ items } = await api.listOperations(payer, { limit: 10, order: "desc", minHeight: 0 }));
    });

    it("should return one native OUT operation per recipient with a fee-exclusive value", () => {
      const native = items.filter(o => o.asset.type === "native");
      expect(native).toHaveLength(2);
      expect(native.map(o => o.recipients).sort()).toEqual([[r1], [r2]].sort());
      for (const op of native) {
        expect(op).toMatchObject({ type: "OUT", value: 1000000n });
      }
    });

    it("should report the tx fee on every native operation", () => {
      const native = items.filter(o => o.asset.type === "native");
      for (const op of native) {
        expect(op.tx.fees).toBe(BigInt(fee));
      }
    });

    it("should not create a standalone FEES operation when HBAR moved", () => {
      expect(items.some(o => o.type === "FEES")).toBe(false);
    });

    it("should return one OUT operation per HTS token with the raw token value", () => {
      const tokens = items.filter(o => o.asset.type !== "native");
      expect(tokens).toHaveLength(2);
      expect(
        tokens
          .map(t => [(t.asset as { assetReference: string }).assetReference, t.value].join(":"))
          .sort(),
      ).toEqual([`${hbark}:2`, `${usdc}:10000`].sort());
      expect(tokens.every(t => t.type === "OUT")).toBe(true);
      expect(tokens.every(t => t.tx.fees === BigInt(fee))).toBe(true);
    });
  });
});
