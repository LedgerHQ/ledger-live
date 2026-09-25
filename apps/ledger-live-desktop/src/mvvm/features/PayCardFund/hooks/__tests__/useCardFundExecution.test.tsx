import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { useRequestCardFundPayloadMutation } from "@domain/api-card-funding";
import type { CardAssetRow } from "@features/flow-pay-card-assets";
import { decodeFundPayload } from "@ledgerhq/hw-app-exchange";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { Transaction } from "@ledgerhq/live-common/coin-modules/transaction-types";
import { useBroadcast } from "@ledgerhq/live-common/hooks/useBroadcast";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { act, renderHook, waitFor } from "tests/testSetup";
import { useStartExchangeAction, useTransactionAction } from "~/renderer/hooks/useConnectAppAction";
import { buildCardFundTransaction } from "../../utils/buildCardFundTransaction";
import { useCardFundExecution } from "../useCardFundExecution";

jest.mock("@domain/api-card-funding", () => ({
  useRequestCardFundPayloadMutation: jest.fn(),
}));
jest.mock("@ledgerhq/hw-app-exchange", () => ({
  decodeFundPayload: jest.fn(),
}));
jest.mock("@ledgerhq/live-common/hooks/useBroadcast", () => ({
  useBroadcast: jest.fn(),
}));
jest.mock("~/renderer/hooks/useConnectAppAction", () => ({
  useStartExchangeAction: jest.fn(),
  useTransactionAction: jest.fn(),
}));
jest.mock("@ledgerhq/live-common/hw/actions/completeExchange", () => ({
  createAction: jest.fn(() => ({})),
}));
jest.mock("@ledgerhq/live-common/exchange/platform/completeExchange", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("../../utils/buildCardFundTransaction", () => ({
  buildCardFundTransaction: jest.fn(),
}));

const parentAccount = genAccount("ethereum-account", {
  currency: getCryptoCurrencyById("ethereum"),
  operationsSize: 0,
});
const sourceAccount = {
  ...genTokenAccount(0, parentAccount, usdcToken),
  balance: new BigNumber(100_000_000),
  spendableBalance: new BigNumber(100_000_000),
};
parentAccount.subAccounts = [sourceAccount];

const asset: CardAssetRow = {
  id: "card-wallet",
  address: "0x2222222222222222222222222222222222222222",
  currency: "usdc",
  network: "ethereum",
  name: "USD Coin",
  ticker: "USDC",
  ledgerId: usdcToken.id,
  cryptoAmount: "50 USDC",
  countervalue: "$50.00",
  countervalueAmount: 50,
};
const signedPayload = { payload: "ChFQ", signature: "27cba8" };
const transaction = { family: "evm", amount: new BigNumber(25_000_000) } as Transaction;
const signedOperation = { signature: "signed-operation" };
const broadcast = jest.fn();
const requestCardFundPayload = jest.fn();
const forgetCardFundPayload = jest.fn();

async function finishDeviceStep(
  result: { current: ReturnType<typeof useCardFundExecution> },
  stepId: "start" | "confirm" | "sign",
  response: unknown,
) {
  await waitFor(() => {
    expect(result.current.deviceStep).toMatchObject({ kind: "device", stepId });
  });

  let request: unknown;
  act(() => {
    const step = result.current.deviceStep;
    if (step.kind !== "device") throw new Error(`Expected ${stepId} device step`);

    step.withDeviceAction(binding => {
      request = binding.request;
      binding.onResult(response as never);
      return null;
    });
  });
  return request;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useStartExchangeAction).mockReturnValue({} as never);
  jest.mocked(useTransactionAction).mockReturnValue({} as never);
  jest.mocked(useBroadcast).mockReturnValue(broadcast);
  jest.mocked(buildCardFundTransaction).mockResolvedValue(transaction);
  jest
    .mocked(useRequestCardFundPayloadMutation)
    .mockReturnValue([requestCardFundPayload, { reset: forgetCardFundPayload }] as never);
  jest.mocked(decodeFundPayload).mockResolvedValue({ inAddress: asset.address } as never);

  requestCardFundPayload.mockReturnValue({
    unwrap: jest.fn().mockResolvedValue(signedPayload),
  });
  broadcast.mockResolvedValue({ hash: "operation-hash" });
});

it("signs the provider payload for the linked wallet and broadcasts it", async () => {
  const { result } = renderHook(() =>
    useCardFundExecution({ account: sourceAccount, parentAccount, asset }),
  );

  let execution!: Promise<void>;
  act(() => {
    execution = result.current.execute("25");
  });

  await finishDeviceStep(result, "start", {
    startExchangeResult: { nonce: "device-nonce", device: {} },
  });
  const confirmRequest = await finishDeviceStep(result, "confirm", {
    completeExchangeResult: transaction,
  });
  await finishDeviceStep(result, "sign", { signedOperation });
  await act(async () => execution);

  expect(requestCardFundPayload).toHaveBeenCalledWith({
    transactionId: "device-nonce",
    inAmount: 25_000_000,
    currency: "usdc",
    inAddress: asset.address,
  });
  expect(forgetCardFundPayload).toHaveBeenCalled();
  expect(buildCardFundTransaction).toHaveBeenCalledWith(
    expect.objectContaining({
      account: sourceAccount,
      parentAccount,
      payinAddress: asset.address,
      binaryPayload: "ChFQ",
    }),
  );
  expect(confirmRequest).toMatchObject({
    binaryPayload: Buffer.from("ChFQ", "utf8").toString("hex"),
    signature: "27cba8",
  });
  expect(broadcast).toHaveBeenCalledWith(signedOperation);
  expect(result.current.deviceStep).toEqual({
    kind: "success",
    operationHash: "operation-hash",
  });
});

it("stops before the device confirmation when the payload pays another address", async () => {
  jest
    .mocked(decodeFundPayload)
    .mockResolvedValue({ inAddress: "0x3333333333333333333333333333333333333333" } as never);
  const { result } = renderHook(() =>
    useCardFundExecution({ account: sourceAccount, parentAccount, asset }),
  );

  let execution!: Promise<void>;
  act(() => {
    execution = result.current.execute("25");
  });
  await finishDeviceStep(result, "start", {
    startExchangeResult: { nonce: "device-nonce", device: {} },
  });
  await act(async () => execution);

  expect(buildCardFundTransaction).not.toHaveBeenCalled();
  expect(broadcast).not.toHaveBeenCalled();
  expect(result.current.deviceStep).toMatchObject({
    kind: "error",
    error: new Error("The Fund payload does not target the selected card wallet"),
  });
});

it("shows the provider's refusal message", async () => {
  requestCardFundPayload.mockReturnValue({
    unwrap: jest.fn().mockRejectedValue({ status: "CUSTOM_ERROR", error: "User not logged in" }),
  });
  const { result } = renderHook(() =>
    useCardFundExecution({ account: sourceAccount, parentAccount, asset }),
  );

  let execution!: Promise<void>;
  act(() => {
    execution = result.current.execute("25");
  });
  await finishDeviceStep(result, "start", {
    startExchangeResult: { nonce: "device-nonce", device: {} },
  });
  await act(async () => execution);

  expect(forgetCardFundPayload).toHaveBeenCalled();
  expect(result.current.deviceStep).toMatchObject({
    kind: "error",
    error: new Error("User not logged in"),
  });
});

it("ends the run when the device fails during a step, so a retry starts clean", async () => {
  const { result } = renderHook(() =>
    useCardFundExecution({ account: sourceAccount, parentAccount, asset }),
  );

  let execution!: Promise<void>;
  act(() => {
    execution = result.current.execute("25");
  });
  await waitFor(() => {
    expect(result.current.deviceStep).toMatchObject({ kind: "device", stepId: "start" });
  });

  act(() => {
    result.current.onDeviceError(new Error("Exchange app closed"));
  });
  await act(async () => execution);

  expect(result.current.deviceStep).toMatchObject({
    kind: "error",
    error: new Error("Exchange app closed"),
  });
  expect(requestCardFundPayload).not.toHaveBeenCalled();

  act(() => result.current.reset());
  expect(result.current.deviceStep).toEqual({ kind: "idle" });
});

it("refuses an amount the provider cannot receive exactly, before the device", async () => {
  const richAccount = {
    ...sourceAccount,
    balance: new BigNumber("1e30"),
    spendableBalance: new BigNumber("1e30"),
  };
  const { result } = renderHook(() =>
    useCardFundExecution({ account: richAccount, parentAccount, asset }),
  );

  await act(async () => result.current.execute("100000000000"));

  expect(result.current.deviceStep).toMatchObject({
    kind: "error",
    error: new Error("This amount cannot be sent to the provider exactly"),
  });
  expect(requestCardFundPayload).not.toHaveBeenCalled();
});

it("shows the message from a serialized device error", () => {
  const { result } = renderHook(() =>
    useCardFundExecution({ account: sourceAccount, parentAccount, asset }),
  );

  act(() => {
    result.current.onDeviceError({
      name: "TransportStatusError",
      message: "Exchange app rejected the command",
    } as Error);
  });

  expect(result.current.deviceStep).toMatchObject({
    kind: "error",
    error: new Error("Exchange app rejected the command"),
  });
});

it("stops before connecting to the device when the linked wallet has no address", async () => {
  const { result } = renderHook(() =>
    useCardFundExecution({
      account: sourceAccount,
      parentAccount,
      asset: { ...asset, address: "" },
    }),
  );

  await act(async () => result.current.execute("25"));

  expect(result.current.deviceStep).toMatchObject({
    kind: "error",
    error: new Error("The selected card wallet has no destination address"),
  });
  expect(requestCardFundPayload).not.toHaveBeenCalled();
});
