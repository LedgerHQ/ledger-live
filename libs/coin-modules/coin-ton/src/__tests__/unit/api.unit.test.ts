import {
  estimateFee,
  fetchAccountInfo,
  fetchJettonTransactions,
  fetchJettonWallets,
  fetchLastBlockNumber,
  fetchTransactions,
} from "../../bridge/bridgeHelpers/api";
import { setCoinConfig } from "../../config";
import mockServer, { API_TON_ENDPOINT } from "../fixtures/api.fixtures";
import {
  jettonTransferResponse,
  jettonWallets,
  lastBlockNumber,
  mockAddress,
  tonAccount,
  tonEstimateFee,
  tonTransactionResponse,
  tonWallet,
} from "../fixtures/common.fixtures";

describe("getAccount", () => {
  beforeAll(() => {
    setCoinConfig(() => ({
      status: {
        type: "active",
      },
      infra: {
        API_TON_ENDPOINT: API_TON_ENDPOINT,
      },
    }));
    mockServer.listen();
  });

  afterAll(() => {
    mockServer.close();
  });

  it("should return last block number", async () => {
    const result = await fetchLastBlockNumber();
    expect(result).toEqual(lastBlockNumber.last.seqno);
  });

  it("should return the transactions of an address", async () => {
    const result = await fetchTransactions(mockAddress);
    expect(result).toEqual(tonTransactionResponse);
  });

  it("should return the ton account info of an address", async () => {
    const result = await fetchAccountInfo(mockAddress);
    expect(result).toEqual({
      balance: tonAccount.balance,
      last_transaction_lt: tonAccount.last_transaction_lt,
      last_transaction_hash: tonAccount.last_transaction_hash,
      status: tonAccount.status,
      seqno: tonWallet.seqno,
    });
  });

  it("should return the jetton transactions", async () => {
    const result = await fetchJettonTransactions(mockAddress);
    expect(result).toEqual(jettonTransferResponse.jetton_transfers);
  });

  it("should return the jetton wallets", async () => {
    const result = await fetchJettonWallets();
    expect(result).toEqual(jettonWallets.jetton_wallets);
  });

  it("should return the estimated fees", async () => {
    const result = await estimateFee(mockAddress, "");
    expect(result).toEqual(tonEstimateFee.source_fees);
  });
});
