import React, { useEffect } from "react";
import { EMPTY } from "rxjs";
import { act, render, screen, waitFor } from "tests/testSetup";
import { mockAccountEntry } from "@domain/entity-account/schema.mock";
import { BalanceAssetIdSchema } from "@domain/entity-account-balance";
import { AccountDataSourceIdSchema } from "@domain/entity-account-data";
import { mockPreparedTransaction } from "@domain/entity-account-transaction/schema.mock";
import { ReceiveAddressSchema, type ReceiveAddress } from "@domain/entity-account-receive";
import type {
  AccountDataReceiveParams,
  AccountDataSignMessageParams,
  AccountDataSignTransactionParams,
  AccountDataUiHook,
} from "@features/platform-wallet-api-server";
import WalletAPIAccountDataSignDialog from "..";
import { useAccountDataUiHook } from "../hooks/useAccountDataUiHook";

const mockSigned = { payload: "signed", serialized: "abcdef" };
const mockSignature = "0123";

jest.mock("LLD/components/DeviceIntentExecutor", () => ({
  buildDeviceInitializationInput: jest.fn(async () => ({
    appName: "Ethereum",
    dependencies: [],
    requireLatestFirmware: false,
  })),
  DeviceIntentExecutor: (props: {
    intent: { input: { sign: unknown }; onResult?: (result: unknown) => void };
    onIntentJobStateChanged?: (jobState: unknown) => void;
    onIntentJobComplete?: () => void;
    onIntentJobError?: (error: unknown) => void;
    onUserCancel: () => void;
  }) => (
    <div data-testid="device-intent-executor">
      <button
        onClick={() => {
          props.intent.onResult?.(
            props.intent.input.sign === mockSignTx ? mockSigned : mockSignature,
          );
          props.onIntentJobComplete?.();
        }}
      >
        sign on device
      </button>
      <button onClick={() => props.onIntentJobStateChanged?.({ type: "verified", address: "" })}>
        verified on device
      </button>
      <button
        onClick={() =>
          props.onIntentJobStateChanged?.({
            type: "mismatch",
            expectedAddress: "",
            reportedAddress: "",
          })
        }
      >
        mismatch on device
      </button>
      <button onClick={() => props.onIntentJobError?.(new Error("disconnected"))}>fail</button>
      <button onClick={props.onUserCancel}>close executor</button>
    </div>
  ),
}));

const mockSignTx = jest.fn(() => EMPTY);
const signMessage = jest.fn(() => EMPTY);

const account = {
  entry: mockAccountEntry(),
  assetId: BalanceAssetIdSchema.parse("ethereum"),
};

function transactionParams(
  overrides: Partial<Record<string, unknown>> = {},
): AccountDataSignTransactionParams {
  return {
    account,
    prepared: {
      target: { accountUUID: account.entry.accountUUID, descriptor: account.entry.descriptor },
      sourceId: AccountDataSourceIdSchema.parse("alpaca"),
      prepared: mockPreparedTransaction({
        amount: "1000000000000000000",
        fees: "21000000000000",
        totalSpent: "1000021000000000000",
        ...overrides,
      }),
    },
    sign: mockSignTx,
    onSuccess: jest.fn(),
    onCancel: jest.fn(),
    onError: jest.fn(),
  };
}

function messageParams(messageHex: string): AccountDataSignMessageParams {
  return {
    account,
    messageHex,
    sign: signMessage,
    onSuccess: jest.fn(),
    onCancel: jest.fn(),
    onError: jest.fn(),
  };
}

const ADDRESS = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";

function receiveParams(receive: ReceiveAddress): AccountDataReceiveParams {
  return { account, receive, onSuccess: jest.fn(), onCancel: jest.fn(), onError: jest.fn() };
}

const verifiedReceive = ReceiveAddressSchema.parse({
  address: ADDRESS,
  verification: { type: "address", path: "m/44h/60h/0h/0/0", address: ADDRESS },
});

function renderDialog() {
  const hook: { current?: AccountDataUiHook } = {};
  function Harness() {
    const ui = useAccountDataUiHook();
    useEffect(() => {
      hook.current = ui;
    }, [ui]);
    return null;
  }
  const result = render(
    <>
      <Harness />
      <WalletAPIAccountDataSignDialog />
    </>,
  );
  const openTransaction = (params: AccountDataSignTransactionParams) =>
    act(() => hook.current?.["transaction.sign"]?.(params));
  const openMessage = (params: AccountDataSignMessageParams) =>
    act(() => hook.current?.["message.sign"]?.(params));
  const openReceive = (params: AccountDataReceiveParams) =>
    act(() => hook.current?.["account.receive"]?.(params));
  return { ...result, openTransaction, openMessage, openReceive };
}

const TRANSACTION_DIALOG = "wallet-api-account-data-sign-transaction";
const MESSAGE_DIALOG = "wallet-api-account-data-sign-message";

const RECEIVE_DIALOG = "wallet-api-account-data-receive";

const confirmButton = (kind: "transaction" | "message") =>
  screen.getByTestId(`wallet-api-account-data-sign-${kind}-confirm`);
const receiveConfirmButton = () => screen.getByTestId(`${RECEIVE_DIALOG}-confirm`);

describe("WalletAPIAccountDataSign", () => {
  it("should show the transaction summary and sign it on the device", async () => {
    const { user, openTransaction } = renderDialog();
    const params = transactionParams();
    openTransaction(params);

    expect(await screen.findByTestId(TRANSACTION_DIALOG)).toBeVisible();
    expect(screen.getByTestId("wallet-api-account-data-sign-recipient")).toHaveTextContent(
      "0x0000000000000000000000000000000000000002",
    );
    expect(screen.getByTestId("wallet-api-account-data-sign-amount")).toHaveTextContent("1 ETH");
    expect(screen.getByTestId("wallet-api-account-data-sign-fees")).toHaveTextContent(
      "0.000021 ETH",
    );
    expect(screen.getByTestId("wallet-api-account-data-sign-total")).toHaveTextContent(
      "1.000021 ETH",
    );

    await waitFor(() => expect(confirmButton("transaction")).toBeEnabled());
    await user.click(confirmButton("transaction"));
    await user.click(screen.getByText("sign on device"));

    expect(params.onSuccess).toHaveBeenCalledWith(mockSigned);
    expect(params.onCancel).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.queryByTestId("device-intent-executor")).not.toBeInTheDocument(),
    );
  });

  it("should keep confirm disabled while the transaction has errors, and show warnings", async () => {
    const { openTransaction } = renderDialog();
    openTransaction(
      transactionParams({
        errors: [{ name: "NotEnoughBalance", message: "Not enough balance" }],
        warnings: [{ name: "HighFees", message: "Fees are high" }],
      }),
    );

    expect(await screen.findByText("Not enough balance")).toBeVisible();
    expect(screen.getByText("Fees are high")).toBeVisible();
    await waitFor(() =>
      expect(screen.queryByTestId("wallet-api-account-data-sign-pending")).toBeNull(),
    );
    expect(confirmButton("transaction")).toBeDisabled();
  });

  it("should cancel when the user closes the review", async () => {
    const { user, openTransaction } = renderDialog();
    const params = transactionParams();
    openTransaction(params);

    await screen.findByTestId(TRANSACTION_DIALOG);
    await user.keyboard("{Escape}");

    expect(params.onCancel).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByTestId(TRANSACTION_DIALOG)).not.toBeInTheDocument());
  });

  it("should report a device failure and close, so no later signature is lost", async () => {
    const { user, openTransaction } = renderDialog();
    const params = transactionParams();
    openTransaction(params);

    await waitFor(() => expect(confirmButton("transaction")).toBeEnabled());
    await user.click(confirmButton("transaction"));
    await user.click(screen.getByText("fail"));
    expect(params.onError).toHaveBeenCalledWith(new Error("disconnected"));

    await waitFor(() =>
      expect(screen.queryByTestId("device-intent-executor")).not.toBeInTheDocument(),
    );
  });

  it("should cancel a pending request when another one opens", async () => {
    const { openTransaction, openMessage } = renderDialog();
    const first = transactionParams();
    openTransaction(first);
    await screen.findByTestId(TRANSACTION_DIALOG);

    openMessage(messageParams(Buffer.from("hello").toString("hex")));

    expect(first.onCancel).toHaveBeenCalledTimes(1);
    expect(await screen.findByTestId(MESSAGE_DIALOG)).toBeVisible();
  });

  it.each([
    ["a printable message as text", Buffer.from("Sign in\nnonce: 42").toString("hex"), "Sign in"],
    ["a binary message as hex", "00ff10", "0x00ff10"],
  ])("should show %s and sign it on the device", async (_, messageHex, shown) => {
    const { user, openMessage } = renderDialog();
    const params = messageParams(messageHex);
    openMessage(params);

    expect(await screen.findByTestId(MESSAGE_DIALOG)).toBeVisible();
    expect(screen.getByTestId("wallet-api-account-data-sign-message-content")).toHaveTextContent(
      shown,
    );

    await waitFor(() => expect(confirmButton("message")).toBeEnabled());
    await user.click(confirmButton("message"));
    await user.click(screen.getByText("sign on device"));

    expect(params.onSuccess).toHaveBeenCalledWith(mockSignature);
  });

  it("should confirm a receive address without a device when it has no verification", async () => {
    const { user, openReceive } = renderDialog();
    const params = receiveParams(ReceiveAddressSchema.parse({ address: ADDRESS }));
    openReceive(params);

    expect(await screen.findByTestId(RECEIVE_DIALOG)).toBeVisible();
    expect(screen.getByTestId("wallet-api-account-data-receive-address")).toHaveTextContent(
      ADDRESS,
    );
    expect(receiveConfirmButton()).toHaveTextContent("Confirm");
    await user.click(receiveConfirmButton());

    expect(params.onSuccess).toHaveBeenCalledWith(ADDRESS);
    await waitFor(() => expect(screen.queryByTestId(RECEIVE_DIALOG)).not.toBeInTheDocument());
  });

  it("should verify a receive address on the device", async () => {
    const { user, openReceive } = renderDialog();
    const params = receiveParams(verifiedReceive);
    openReceive(params);

    await waitFor(() => expect(receiveConfirmButton()).toBeEnabled());
    expect(receiveConfirmButton()).toHaveTextContent("Verify on device");
    await user.click(receiveConfirmButton());
    await user.click(screen.getByText("verified on device"));

    expect(params.onSuccess).toHaveBeenCalledWith(ADDRESS);
    await waitFor(() =>
      expect(screen.queryByTestId("device-intent-executor")).not.toBeInTheDocument(),
    );
  });

  it("should report a receive address the device does not match", async () => {
    const { user, openReceive } = renderDialog();
    const params = receiveParams(verifiedReceive);
    openReceive(params);

    await waitFor(() => expect(receiveConfirmButton()).toBeEnabled());
    await user.click(receiveConfirmButton());
    await user.click(screen.getByText("mismatch on device"));

    expect(params.onSuccess).not.toHaveBeenCalled();
    expect(params.onError).toHaveBeenCalledTimes(1);
  });

  it("should cancel a receive when the user closes it", async () => {
    const { user, openReceive } = renderDialog();
    const params = receiveParams(verifiedReceive);
    openReceive(params);

    await screen.findByTestId(RECEIVE_DIALOG);
    await user.keyboard("{Escape}");

    expect(params.onCancel).toHaveBeenCalledTimes(1);
  });
});
