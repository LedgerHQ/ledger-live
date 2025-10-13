import { genericPrepareTransaction } from "../prepareTransaction";
import { getAlpacaApi } from "../alpaca";
import BigNumber from "bignumber.js";
import * as accountModule from "@ledgerhq/coin-framework/account/index";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";

jest.mock("../alpaca", () => ({
  getAlpacaApi: jest.fn(),
}));

describe("genericPrepareTransaction", () => {
  const network = "testnet";
  const kind = "local";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("embeds assets info, if existing", async () => {
    (getAlpacaApi as jest.Mock).mockReturnValue({
      estimateFees: jest.fn().mockResolvedValue({ value: 500n }),
      getAssetFromToken: jest.fn().mockImplementation((token, owner) => {
        return {
          assetOwner: owner,
          assetReference: token.contractAddress,
        };
      }),
    });
    jest.spyOn(accountModule, "decodeTokenAccountId").mockImplementation(accountId => {
      const token =
        accountId === "ethereum_usdc_sub_account"
          ? ({ contractAddress: "usdc_contract" } as TokenCurrency)
          : undefined;

      return { accountId, token };
    });

    const prepareTransaction = genericPrepareTransaction(network, kind);
    const resultUsdcToken = await prepareTransaction(
      { currency: { id: "ethereum", units: [{}] }, freshAddress: "0xabc" } as Account,
      {
        amount: new BigNumber(100_000),
        fees: new BigNumber(500),
        recipient: "0xrecipient",
        family: "family",
        subAccountId: "ethereum_usdc_sub_account",
      },
    );

    expect(resultUsdcToken).toEqual({
      amount: new BigNumber(100_000),
      fees: new BigNumber(500),
      recipient: "0xrecipient",
      family: "family",
      assetReference: "usdc_contract",
      assetOwner: "0xabc",
      subAccountId: "ethereum_usdc_sub_account",
    });

    const resultUnknownToken = await prepareTransaction(
      { currency: { id: "ethereum", units: [{}] } } as Account,
      {
        amount: new BigNumber(100_000),
        fees: new BigNumber(500),
        recipient: "0xrecipient",
        family: "family",
        subAccountId: "ethereum_unknown_sub_account",
      },
    );

    expect(resultUnknownToken).toEqual({
      amount: new BigNumber(100_000),
      fees: new BigNumber(500),
      recipient: "0xrecipient",
      family: "family",
      assetReference: "",
      assetOwner: "",
      subAccountId: "ethereum_unknown_sub_account",
    });
  });

  it.each([
    ["all native amount", { useAllAmount: true }, new BigNumber(42)],
    ["all native amount on staking scenarios", { mode: "stake" }, new BigNumber(42)],
    ["all native amount on unstaking scenarios", { mode: "unstake" }, new BigNumber(42)],
    [
      "all token amount",
      { subAccountId: "ethereum_usdc_sub_account", useAllAmount: true },
      new BigNumber(5),
    ],
    [
      "all token amount on staking scenarios",
      { subAccountId: "ethereum_usdc_sub_account", mode: "stake" },
      new BigNumber(5),
    ],
    [
      "all token amount on unstaking scenarios",
      { subAccountId: "ethereum_usdc_sub_account", mode: "unstake" },
      new BigNumber(5),
    ],
  ] as const)("uses %s, updating the amount", async (_s, partialTransaction, expectedAmount) => {
    (getAlpacaApi as jest.Mock).mockReturnValue({
      estimateFees: jest.fn().mockResolvedValue({ value: 8n }),
      getAssetFromToken: jest.fn().mockImplementation((token, owner) => {
        return {
          assetOwner: owner,
          assetReference: token.contractAddress,
        };
      }),
    });
    jest.spyOn(accountModule, "decodeTokenAccountId").mockImplementation(accountId => {
      const token =
        accountId === "ethereum_usdc_sub_account"
          ? ({ contractAddress: "usdc_contract" } as TokenCurrency)
          : undefined;

      return { accountId, token };
    });

    const prepareTransaction = genericPrepareTransaction(network, kind);
    const result = await prepareTransaction(
      {
        currency: { id: "ethereum", units: [{}] },
        spendableBalance: new BigNumber(50),
        subAccounts: [{ id: "ethereum_usdc_sub_account", spendableBalance: new BigNumber(5) }],
      } as Account,
      {
        amount: new BigNumber(0),
        recipient: "0xrecipient",
        family: "family",
        ...partialTransaction,
      },
    );

    expect(result).toMatchObject({
      amount: expectedAmount,
      fees: new BigNumber(8),
      recipient: "0xrecipient",
      family: "family",
    });
  });

  it("updates fees from the estimation", async () => {
    (getAlpacaApi as jest.Mock).mockReturnValue({
      estimateFees: jest.fn().mockResolvedValue({ value: 700n }),
    });

    const prepareTransaction = genericPrepareTransaction(network, kind);
    const result = await prepareTransaction(
      { currency: { id: "ethereum", units: [{}] } } as Account,
      {
        amount: new BigNumber(100_000),
        fees: new BigNumber(500),
        recipient: "0xrecipient",
        family: "family",
      },
    );

    expect(result).toEqual({
      amount: new BigNumber(100_000),
      fees: new BigNumber(700),
      recipient: "0xrecipient",
      family: "family",
      assetReference: "",
      assetOwner: "",
    });
  });

  it("updates fees from the existing custom", async () => {
    (getAlpacaApi as jest.Mock).mockReturnValue({
      estimateFees: jest.fn().mockResolvedValue({ value: 700n }),
    });

    const prepareTransaction = genericPrepareTransaction(network, kind);
    const result = await prepareTransaction(
      { currency: { id: "ethereum", units: [{}] } } as Account,
      {
        amount: new BigNumber(100_000),
        fees: new BigNumber(500),
        recipient: "0xrecipient",
        family: "family",
        customFees: { parameters: { fees: new BigNumber(600) } },
      },
    );

    expect(result).toEqual({
      amount: new BigNumber(100_000),
      fees: new BigNumber(600),
      customFees: { parameters: { fees: new BigNumber(600) } },
      recipient: "0xrecipient",
      family: "family",
      assetReference: "",
      assetOwner: "",
    });
  });

  it("propagates estimated 'storageLimit'", async () => {
    (getAlpacaApi as jest.Mock).mockReturnValue({
      estimateFees: jest
        .fn()
        .mockResolvedValue({ value: 700n, parameters: { storageLimit: 277n } }),
    });

    const prepareTransaction = genericPrepareTransaction(network, kind);
    const result = await prepareTransaction(
      { currency: { id: "ethereum", units: [{}] } } as Account,
      {
        amount: new BigNumber(100_000),
        fees: new BigNumber(500),
        recipient: "0xrecipient",
        family: "family",
      },
    );

    expect(result).toEqual({
      amount: new BigNumber(100_000),
      fees: new BigNumber(700),
      storageLimit: new BigNumber(277),
      recipient: "0xrecipient",
      family: "family",
      assetReference: "",
      assetOwner: "",
    });
  });

  it("keeps the amount used during the estimation when using all native amount", async () => {
    (getAlpacaApi as jest.Mock).mockReturnValue({
      estimateFees: jest.fn().mockResolvedValue({ value: 700n, parameters: { amount: 1000n } }),
    });

    const prepareTransaction = genericPrepareTransaction(network, kind);
    const result = await prepareTransaction(
      { currency: { id: "ethereum", units: [{}] } } as Account,
      {
        amount: new BigNumber(0),
        fees: new BigNumber(500),
        recipient: "0xrecipient",
        family: "family",
        useAllAmount: true,
      },
    );

    expect(result).toEqual({
      amount: new BigNumber(1000),
      fees: new BigNumber(700),
      recipient: "0xrecipient",
      family: "family",
      assetReference: "",
      assetOwner: "",
      useAllAmount: true,
    });
  });
});
