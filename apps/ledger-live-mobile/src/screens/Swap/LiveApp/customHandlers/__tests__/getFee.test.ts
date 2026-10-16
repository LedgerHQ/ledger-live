import { BigNumber } from "bignumber.js";
import { EMPTY } from "rxjs";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import type { Account } from "@ledgerhq/types-live";
import { getFee, type FeeParams } from "../getFee";

jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  getAccountBridge: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/wallet-api/converters", () => ({
  getAccountIdFromWalletAccountId: jest.fn((walletAccountId: string) => walletAccountId),
}));

const status = {
  errors: {},
  warnings: {},
  estimatedFees: new BigNumber(1500),
  amount: new BigNumber(100_000),
  totalSpent: new BigNumber(101_500),
};

function mockBridge(createdTransaction: Record<string, unknown>) {
  const bridge = {
    sync: jest.fn(() => EMPTY),
    createTransaction: jest.fn(() => createdTransaction),
    prepareTransaction: jest.fn(
      async (_account: Account, transaction: Record<string, unknown>) => transaction,
    ),
    getTransactionStatus: jest.fn(async () => status),
    getEstimationRecipient: jest.fn(() => "estimation-recipient"),
  };
  jest.mocked(getAccountBridge).mockResolvedValue(bridge as never);
  return bridge;
}

function buildParams(account: Account, customFeeConfig: Record<string, unknown>): FeeParams {
  return {
    fromAccountId: account.id,
    fromAmount: "0.001",
    feeStrategy: "medium",
    openDrawer: false,
    customFeeConfig,
    SWAP_VERSION: "2",
  };
}

describe("getFee", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should put the live app's bitcoin fee settings in familySpecificData", async () => {
    const account = genAccount("swap-get-fee-bitcoin", {
      currency: getCryptoCurrencyById("bitcoin"),
    });
    const bridge = mockBridge({
      family: "bitcoin",
      amount: new BigNumber(0),
      recipient: "",
      familySpecificData: { utxoStrategy: { strategy: 0, excludeUTXOs: [] }, rbf: true },
    });
    const utxoStrategy = { strategy: 1, excludeUTXOs: [{ hash: "txid", outputIndex: 0 }] };

    const getFeeData = getFee([account], {} as never);
    await getFeeData({ params: buildParams(account, { feePerByte: "15", utxoStrategy }) });

    const [, prepared] = bridge.prepareTransaction.mock.calls[0];
    expect(prepared.familySpecificData).toEqual({ rbf: true, feePerByte: "15", utxoStrategy });
    expect(prepared).not.toHaveProperty("feePerByte");
    expect(prepared).not.toHaveProperty("utxoStrategy");
  });

  it("should spread the live app's fee settings as BigNumbers for other families", async () => {
    const account = genAccount("swap-get-fee-ethereum", {
      currency: getCryptoCurrencyById("ethereum"),
    });
    const bridge = mockBridge({ family: "evm", amount: new BigNumber(0), recipient: "" });

    const getFeeData = getFee([account], {} as never);
    await getFeeData({
      params: buildParams(account, { maxFeePerGas: "100", maxPriorityFeePerGas: "2" }),
    });

    const [, prepared] = bridge.prepareTransaction.mock.calls[0];
    expect(prepared.maxFeePerGas).toEqual(new BigNumber(100));
    expect(prepared.maxPriorityFeePerGas).toEqual(new BigNumber(2));
    expect(prepared).not.toHaveProperty("familySpecificData");
  });
});
