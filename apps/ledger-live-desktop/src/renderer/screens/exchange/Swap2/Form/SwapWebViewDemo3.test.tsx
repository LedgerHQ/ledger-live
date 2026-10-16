import React from "react";
import BigNumber from "bignumber.js";
import { of } from "rxjs";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/impl";
import { getEvmTransactionByHash } from "@ledgerhq/live-common/families/evm/getTransactionByHash";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import {
  getWalletApiIdFromAccountId,
  setWalletApiIdForAccountId,
} from "@ledgerhq/live-common/wallet-api/converters";
import type { Account } from "@ledgerhq/types-live";
import { render } from "tests/testSetup";
import SwapWebView from "./SwapWebViewDemo3";

const mockWebview = jest.fn();
jest.mock("~/renderer/components/Web3AppWebview", () => ({
  Web3AppWebview: (props: unknown) => {
    mockWebview(props);
    return null;
  },
}));

const mockPTXHandlers = {};
jest.mock("~/renderer/components/WebPTXPlayer/CustomHandlers", () => ({
  usePTXCustomHandlers: () => mockPTXHandlers,
}));

jest.mock("~/renderer/components/WebPlatformPlayer/CustomHandlers", () => ({
  useDeeplinkCustomHandlers: () => ({}),
}));

jest.mock("@ledgerhq/live-common/bridge/impl", () => ({
  getAccountBridge: jest.fn(),
  getCurrencyBridge: jest.fn(),
  getAccountBridgeByFamily: jest.fn(),
}));

jest.mock(
  "@ledgerhq/live-common/families/evm/getTransactionByHash",
  () => ({ getEvmTransactionByHash: jest.fn() }),
  { virtual: true },
);

type GetFee = (args: { params: Record<string, unknown> }) => Promise<{
  customFeeConfig: object;
}>;

const manifest = { id: "swap-live-app", url: "https://swap.example" } as LiveAppManifest;

const buildBridge = (transaction: Record<string, unknown>) => ({
  sync: () => of((account: Account) => account),
  createTransaction: () => transaction,
  prepareTransaction: jest.fn((_account: Account, tx: Record<string, unknown>) =>
    Promise.resolve(tx),
  ),
  getTransactionStatus: () =>
    Promise.resolve({
      errors: {},
      warnings: {},
      estimatedFees: new BigNumber(1000),
      amount: new BigNumber(0),
      totalSpent: new BigNumber(0),
    }),
  getEstimationRecipient: () => "estimation-recipient",
});

const getFee = async (
  account: Account,
  transaction: Record<string, unknown>,
  customFeeConfig: Record<string, unknown>,
) => {
  const bridge = buildBridge(transaction);
  jest.mocked(getAccountBridge).mockReturnValue(bridge as never);
  setWalletApiIdForAccountId(account.id);
  render(<SwapWebView manifest={manifest} />, { initialState: { accounts: [account] } });

  const { customHandlers } = mockWebview.mock.calls[mockWebview.mock.calls.length - 1][0];
  const handler: GetFee = customHandlers["custom.getFee"];
  const result = await handler({
    params: {
      fromAccountId: getWalletApiIdFromAccountId(account.id),
      fromAmount: "1",
      feeStrategy: "custom",
      openDrawer: false,
      customFeeConfig,
      SWAP_VERSION: "2.35",
    },
  });
  return { result, prepared: bridge.prepareTransaction.mock.calls[0][1] };
};

describe("SwapWebView custom.getFee", () => {
  it("estimates a bitcoin transaction with the live app's fee settings as user choices", async () => {
    const account = genAccount("swap-get-fee-bitcoin", {
      currency: getCryptoCurrencyById("bitcoin"),
      operationsSize: 0,
    });
    const utxoStrategy = { strategy: 1, excludeUTXOs: [{ hash: "utxo-hash", outputIndex: 0 }] };

    const { result, prepared } = await getFee(
      account,
      {
        family: "bitcoin",
        amount: new BigNumber(0),
        recipient: "",
        familySpecificData: { rbf: true },
      },
      { feePerByte: "12", utxoStrategy },
    );

    expect(prepared).toMatchObject({ family: "bitcoin", feesStrategy: "custom" });
    expect(prepared.familySpecificData).toEqual({ rbf: true, feePerByte: "12", utxoStrategy });
    expect(prepared).not.toHaveProperty("feePerByte");
    expect(prepared).not.toHaveProperty("utxoStrategy");
    expect(result.customFeeConfig).toEqual({ feePerByte: new BigNumber(12), utxoStrategy });
  });

  it("estimates another family's transaction with the live app's fee settings as fields", async () => {
    const account = genAccount("swap-get-fee-ethereum", {
      currency: getCryptoCurrencyById("ethereum"),
      operationsSize: 0,
    });

    const { prepared } = await getFee(
      account,
      { family: "evm", amount: new BigNumber(0), recipient: "" },
      { maxFeePerGas: "100", maxPriorityFeePerGas: "2" },
    );

    expect(prepared).toMatchObject({
      family: "evm",
      maxFeePerGas: new BigNumber(100),
      maxPriorityFeePerGas: new BigNumber(2),
    });
    expect(prepared).not.toHaveProperty("familySpecificData");
  });
});

describe("SwapWebView custom.getTransactionByHash", () => {
  type GetTransactionByHash = (args: { params: Record<string, unknown> }) => Promise<unknown>;

  const handlerFor = (account: Account): GetTransactionByHash => {
    jest.mocked(getAccountBridge).mockReturnValue(buildBridge({}) as never);
    setWalletApiIdForAccountId(account.id);
    render(<SwapWebView manifest={manifest} />, { initialState: { accounts: [account] } });
    const { customHandlers } = mockWebview.mock.calls[mockWebview.mock.calls.length - 1][0];
    return customHandlers["custom.getTransactionByHash"];
  };

  it("answers the transaction of the main account, as live-common reads it", async () => {
    const account = genAccount("swap-get-transaction-ethereum", {
      currency: getCryptoCurrencyById("ethereum"),
      operationsSize: 0,
    });
    const transaction = { hash: "0xhash", blockHeight: 12, blockHash: "0xblock", value: "1" };
    jest.mocked(getEvmTransactionByHash).mockResolvedValue(transaction);

    const result = await handlerFor(account)({
      params: {
        transactionHash: "0xhash",
        fromAccountId: getWalletApiIdFromAccountId(account.id),
        SWAP_VERSION: "2.35",
      },
    });

    expect(result).toBe(transaction);
    expect(getEvmTransactionByHash).toHaveBeenCalledWith(
      expect.objectContaining({ id: account.id }),
      "0xhash",
    );
  });
});
