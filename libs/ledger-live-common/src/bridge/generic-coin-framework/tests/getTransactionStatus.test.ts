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

  beforeEach(() => {
    jest.clearAllMocks();
    validateIntent.mockResolvedValue(validateIntentResult);
    mockExtractBalances.mockReturnValue({});
    (getCoinModuleApi as jest.Mock).mockReturnValue({ validateIntent });
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
});
