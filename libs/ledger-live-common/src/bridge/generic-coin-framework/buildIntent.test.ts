import BigNumber from "bignumber.js";
import { buildGenericTransactionIntent } from "./buildIntent";
import { getCoinModuleApi } from "./api";
import { buildContext } from "./api/context";
import { getBridgeApi } from "./bridge";
import { getAssetInfos } from "./prepareTransaction";
import { transactionToIntent } from "./utils";

jest.mock("./api", () => ({ getCoinModuleApi: jest.fn() }));
jest.mock("./api/context", () => ({ buildContext: jest.fn(() => ({ config: jest.fn() })) }));
jest.mock("./bridge", () => ({ getBridgeApi: jest.fn() }));
jest.mock("./prepareTransaction", () => ({ getAssetInfos: jest.fn() }));
jest.mock("./utils", () => ({
  transactionToIntent: jest.fn(() => ({ type: "send" })),
  // Returns the pending-token spend to subtract; 0 for these fixtures (no pending ops).
  getPendingTokenSpent: jest.fn(() => 0),
}));

const mockGetCoinModuleApi = getCoinModuleApi as jest.Mock;
const mockBuildContext = buildContext as jest.Mock;
const mockGetBridgeApi = getBridgeApi as jest.Mock;
const mockGetAssetInfos = getAssetInfos as jest.Mock;
const mockTransactionToIntent = transactionToIntent as jest.Mock;

const account = {
  currency: { id: "tron" },
  freshAddress: "TSender",
  subAccounts: [{ id: "sub1", spendableBalance: new BigNumber(999) }],
} as never;

const computeIntentType = jest.fn();
const buildIntentData = jest.fn();
const getAssetFromToken = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockGetCoinModuleApi.mockResolvedValue({ craftTransactionData: jest.fn() });
  mockGetBridgeApi.mockResolvedValue({ getAssetFromToken, computeIntentType, buildIntentData });
  mockGetAssetInfos.mockResolvedValue({ assetReference: "TContract", assetOwner: "TSender" });
});

test("threads resolved asset info and the family builders into transactionToIntent", async () => {
  const transaction = {
    recipient: "TRecv",
    amount: new BigNumber(5),
    subAccountId: "sub1",
  } as never;

  await buildGenericTransactionIntent("tron", "local", account, transaction);

  expect(mockGetAssetInfos).toHaveBeenCalledWith(transaction, "TSender", getAssetFromToken);
  const [passedAccount, passedTx, passedComputeType, , passedBuildData] =
    mockTransactionToIntent.mock.calls[0];
  expect(passedAccount).toBe(account);
  expect(passedTx).toMatchObject({ assetReference: "TContract", assetOwner: "TSender" });
  expect(passedComputeType).toBe(computeIntentType);
  expect(passedBuildData).toBe(buildIntentData);
});

test("a token max-send reads the sub-account spendable balance as the amount", async () => {
  const transaction = {
    recipient: "TRecv",
    amount: new BigNumber(0),
    useAllAmount: true,
    subAccountId: "sub1",
  } as never;

  await buildGenericTransactionIntent("tron", "local", account, transaction);

  const passedTx = mockTransactionToIntent.mock.calls[0][1];
  expect(passedTx.amount).toEqual(new BigNumber(999));
});

test("resolves the coin-module and context by currency id, and the bridge by the family network", async () => {
  // A multi-currency family: the family string ("evm") differs from the currency id ("ethereum").
  const evmAccount = {
    currency: { id: "ethereum" },
    freshAddress: "0xSender",
    subAccounts: [],
  } as never;
  const transaction = { recipient: "0xRecv", amount: new BigNumber(5) } as never;

  await buildGenericTransactionIntent("evm", "local", evmAccount, transaction);

  expect(mockGetCoinModuleApi).toHaveBeenCalledWith("ethereum", "local");
  expect(mockBuildContext).toHaveBeenCalledWith("ethereum");
  expect(mockGetBridgeApi).toHaveBeenCalledWith({ id: "ethereum" }, "evm");
});

test("falls back to the transaction's own asset fields when the family has no getAssetFromToken", async () => {
  mockGetBridgeApi.mockResolvedValue({ computeIntentType, buildIntentData });
  const transaction = {
    recipient: "TRecv",
    amount: new BigNumber(5),
    assetReference: "raw-ref",
    assetOwner: "raw-owner",
  } as never;

  await buildGenericTransactionIntent("tron", "local", account, transaction);

  expect(mockGetAssetInfos).not.toHaveBeenCalled();
  const passedTx = mockTransactionToIntent.mock.calls[0][1];
  expect(passedTx).toMatchObject({ assetReference: "raw-ref", assetOwner: "raw-owner" });
});
