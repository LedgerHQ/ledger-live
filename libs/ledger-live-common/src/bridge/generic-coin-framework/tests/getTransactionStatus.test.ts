import BigNumber from "bignumber.js";
import { genericGetTransactionStatus } from "../getTransactionStatus";
import { getCoinModuleApi } from "../api";
import { getBridgeApi } from "../bridge";
import * as utils from "../utils";

jest.mock("../api", () => ({
  getCoinModuleApi: jest.fn(),
}));

jest.mock("../bridge", () => ({
  getBridgeApi: jest.fn(),
}));

jest.mock("../utils", () => ({
  ...jest.requireActual("../utils"),
  extractBalances: jest.fn(),
}));

const mockExtractBalances = utils.extractBalances as jest.Mock;
const mockGetBridgeApi = getBridgeApi as jest.Mock;

describe("genericGetTransactionStatus", () => {
  const account = {
    id: "test-account",
    freshAddress: "0xSender",
    currency: { id: "ethereum", name: "ethereum", units: [{ name: "ether", code: "ETH" }] },
    pendingOperations: [],
  } as any;

  const validatedAmount = 1000n;
  const validateIntentResult = {
    errors: {},
    warnings: {},
    estimatedFees: 50n,
    amount: validatedAmount,
    totalSpent: 1050n,
    totalFees: 50n,
  };

  const validateIntent = jest.fn();
  // The framework threads a context and calls `craftTransactionData(context, intent)`; mirror the
  // default impl (`{ type: "none" }`).
  const craftTransactionData = () => ({ type: "none" });

  beforeEach(() => {
    jest.clearAllMocks();
    validateIntent.mockResolvedValue(validateIntentResult);
    mockExtractBalances.mockReturnValue({});
    (getCoinModuleApi as jest.Mock).mockReturnValue({ validateIntent, craftTransactionData });
    mockGetBridgeApi.mockResolvedValue({});
  });

  it.each([
    ["useAllAmount is true", new BigNumber(999), true, new BigNumber(validatedAmount.toString())],
    ["amount is 0", new BigNumber(0), false, new BigNumber(validatedAmount.toString())],
    [
      "useAllAmount is false and amount > 0",
      new BigNumber(500),
      false,
      new BigNumber(validatedAmount.toString()),
    ],
  ])(
    "returns validated amount from validateIntent when %s",
    async (_label, txAmount, useAllAmount, expected) => {
      const getStatus = genericGetTransactionStatus("mainnet", "evm");
      const result = await getStatus(account, {
        amount: txAmount,
        useAllAmount,
        recipient: "0x",
        family: "evm",
      } as any);

      expect(result.amount).toEqual(expected);
    },
  );

  it("forwards a destination tag through transactionToIntent to validateIntent", async () => {
    const xrpAccount = {
      ...account,
      freshAddress: "rSender",
      currency: { id: "ripple", name: "ripple", units: [{ name: "ripple", code: "XRP" }] },
    };

    const getStatus = genericGetTransactionStatus("mainnet", "xrp");
    await getStatus(xrpAccount, {
      amount: new BigNumber(100),
      useAllAmount: false,
      recipient: "rRecipient",
      family: "xrp",
      tag: 1234,
    } as any);

    expect(validateIntent).toHaveBeenCalledWith(
      expect.anything(), // context (framework v6)
      expect.objectContaining({
        memo: { type: "map", memos: new Map([["destinationTag", "1234"]]) },
      }),
      expect.anything(),
      expect.anything(),
    );
  });

  it("carries familySpecificData through the draft transaction to the family's buildIntentData", async () => {
    const familySpecificData = { chosenOption: "OPTION_A", chosenList: [], chosenCount: 3 };
    const buildIntentData = jest.fn().mockReturnValue({ type: "none" });
    mockGetBridgeApi.mockResolvedValue({ buildIntentData });
    const getStatus = genericGetTransactionStatus("mainnet", "evm");

    await getStatus(account, {
      amount: new BigNumber(100),
      useAllAmount: false,
      recipient: "0xRecipient",
      family: "evm",
      familySpecificData,
    } as any);

    expect(buildIntentData).toHaveBeenCalledWith(expect.objectContaining({ familySpecificData }));
  });

  it("builds the intent data from the real transaction, not the draft", async () => {
    const buildIntentData = jest.fn().mockReturnValue({ type: "none" });
    mockGetBridgeApi.mockResolvedValue({ buildIntentData });
    const getStatus = genericGetTransactionStatus("mainnet", "evm");

    const transaction = {
      amount: new BigNumber(100),
      useAllAmount: false,
      recipient: "0xRecipient",
      family: "evm",
      withdrawId: "unbonding-7",
      nonce: new BigNumber(4),
      sponsored: true,
    } as any;
    await getStatus(account, transaction);

    expect(buildIntentData).toHaveBeenCalledWith(transaction);
  });

  it("leaves the intent's data to the coin module when the family declares no buildIntentData", async () => {
    const craftTransactionData = jest.fn().mockReturnValue({ type: "none" });
    (getCoinModuleApi as jest.Mock).mockReturnValue({ validateIntent, craftTransactionData });
    const getStatus = genericGetTransactionStatus("mainnet", "evm");

    await getStatus(account, {
      amount: new BigNumber(100),
      useAllAmount: false,
      recipient: "0xRecipient",
      family: "evm",
    } as any);

    expect(craftTransactionData).toHaveBeenCalled();
  });

  describe("buy deeplink", () => {
    const statusWithLinks = async (links: unknown[]) => {
      const error = Object.assign(new Error("NotEnoughGas"), { links });
      validateIntent.mockResolvedValue({ ...validateIntentResult, errors: { gasLimit: error } });
      const getStatus = genericGetTransactionStatus("mainnet", "evm");

      const result = await getStatus(account, {
        amount: new BigNumber(100),
        useAllAmount: false,
        recipient: "0xRecipient",
        family: "evm",
      } as any);

      return (result.errors.gasLimit as unknown as { links: unknown[] }).links;
    };

    it("names the funded account, so the buy flow can pre-select it", async () => {
      expect(await statusWithLinks(["ledgerlive://buy"])).toEqual([
        "ledgerlive://buy?account=test-account",
      ]);
    });

    it("keeps an account the coin module already named", async () => {
      expect(await statusWithLinks(["ledgerlive://buy?account=chosen-by-family"])).toEqual([
        "ledgerlive://buy?account=chosen-by-family",
      ]);
    });

    it("preserves an existing path and query", async () => {
      expect(await statusWithLinks(["ledgerlive://buy/bitcoin?currency=btc"])).toEqual([
        "ledgerlive://buy/bitcoin?currency=btc&account=test-account",
      ]);
    });

    it.each([
      ["another deeplink", "ledgerlive://swap"],
      ["a host that merely starts with buy", "ledgerlive://buyback"],
      ["an http link", "https://example.com/buy"],
    ])("leaves %s untouched", async (_label, link) => {
      expect(await statusWithLinks([link])).toEqual([link]);
    });

    it("carries a non-string entry through rather than dropping it", async () => {
      expect(await statusWithLinks([42])).toEqual([42]);
    });
  });

  describe("customFees.parameters", () => {
    const readParameters = () => validateIntent.mock.calls[0][3].customFees.parameters;

    it("forwards the last estimation's feeParameters so a family need not re-estimate for them", async () => {
      const getStatus = genericGetTransactionStatus("mainnet", "tron");

      await getStatus(account, {
        amount: new BigNumber(100),
        useAllAmount: false,
        recipient: "TRecipient",
        family: "tron",
        feeParameters: { energyRequired: "31895", energyAvailable: "0", energyEstimated: true },
      } as any);

      expect(readParameters()).toMatchObject({
        energyRequired: "31895",
        energyAvailable: "0",
        energyEstimated: true,
      });
    });

    it("lets the framework's own field win a collision, so a family reading it is unaffected", async () => {
      const getStatus = genericGetTransactionStatus("mainnet", "evm");

      await getStatus(account, {
        amount: new BigNumber(100),
        useAllAmount: false,
        recipient: "0xRecipient",
        family: "evm",
        gasLimit: new BigNumber(21000),
        feeParameters: { gasLimit: "999999" },
      } as any);

      expect(readParameters().gasLimit).toBe(21000n);
    });

    it("drops a stale feeParameters key the framework writes as undefined", async () => {
      // `bigNumberToBigIntDeep` filters undefined, so the key is absent rather than shadowing —
      // the same shape a family saw before feeParameters was merged in at all.
      const getStatus = genericGetTransactionStatus("mainnet", "evm");

      await getStatus(account, {
        amount: new BigNumber(100),
        useAllAmount: false,
        recipient: "0xRecipient",
        family: "evm",
        feeParameters: { gasLimit: "999999" },
      } as any);

      expect("gasLimit" in readParameters()).toBe(false);
    });
  });
});
