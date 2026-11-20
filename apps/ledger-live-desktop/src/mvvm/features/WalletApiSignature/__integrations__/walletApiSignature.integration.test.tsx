import React from "react";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { SignedOperation } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { openURL } from "~/renderer/linking";
import { act, render, renderHook, screen, waitFor, withFlagOverrides } from "tests/testSetup";
import { MessageSignatureDialog } from "../components/MessageSignatureDialog";
import { SignMessageIntentComponentLWD } from "../components/MessageSignatureDialog/componentLWD";
import type { WalletApiDeviceIntentSignMessageRequest } from "../components/MessageSignatureDialog/types";
import { TransactionSignatureDialog } from "../components/TransactionSignatureDialog";
import { SignTransactionIntentComponentLWD } from "../components/TransactionSignatureDialog/componentLWD";
import type { WalletApiDeviceIntentSignRequest } from "../components/TransactionSignatureDialog/types";
import {
  useDeviceIntentSignAssignment,
  useDeviceIntentSignEnabled,
} from "../hooks/useDeviceIntentSignEnabled";

type CapturedExecutorProps = {
  sourceFlow: string;
  analyticsProperties?: Record<string, unknown>;
  intent: unknown;
  intentComponentExtraProps?: Record<string, unknown>;
  onIntentJobStateChanged: (state: { type: string; [key: string]: unknown }) => void;
  onIntentJobComplete: () => void;
  onUserCancel: () => void;
};

let capturedExecutorProps: CapturedExecutorProps | undefined;

jest.mock("LLD/components/DeviceIntentExecutor", () => ({
  __esModule: true,
  buildDeviceInitializationInput: jest.fn(() => Promise.resolve({ appName: "Ethereum" })),
  DeviceIntentExecutor: (props: CapturedExecutorProps) => {
    capturedExecutorProps = props;
    return <div data-testid="device-intent-executor" />;
  },
}));

jest.mock("LLD/components/DeviceActionContent", () => ({
  DeviceActionContent: ({
    title,
    description,
    testID,
  }: {
    title?: React.ReactNode;
    description?: React.ReactNode;
    testID?: string;
  }) => (
    <div data-testid={testID}>
      <span>{title}</span>
      <span>{description}</span>
    </div>
  ),
}));

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

const mockPrepareTransaction = jest.fn((_account: unknown, tx: unknown) => Promise.resolve(tx));
jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  getAccountBridge: jest.fn(() => Promise.resolve({ prepareTransaction: mockPrepareTransaction })),
}));

const UNISWAP_ROUTER = "0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad";
const ONEINCH_ROUTER = "0x111111125421ca6dc452d289314280a0f8842a65";

const account = genAccount("wallet-api-sign", {
  currency: getCryptoCurrencyById("ethereum"),
});

function createTransaction(recipient?: string): Transaction {
  const transaction = {
    family: "ethereum",
    amount: account.balance,
    recipient: recipient ?? "",
  };
  // Minimal fixture: prepareTransaction is mocked and returns this object unchanged.
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return transaction as Transaction;
}

function createSignedOperation(id: string): SignedOperation {
  const signedOperation = {
    operation: {
      id,
      hash: id,
      type: "OUT",
      value: account.balance,
      fee: account.balance,
      senders: [],
      recipients: [],
      blockHeight: null,
      blockHash: null,
      accountId: account.id,
      date: new Date(0),
      extra: {},
    },
    signature: "0xsignature",
  };
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return signedOperation as SignedOperation;
}

function createTransactionRequest(
  overrides: Partial<WalletApiDeviceIntentSignRequest> &
    Pick<WalletApiDeviceIntentSignRequest, "onSuccess" | "onError">,
): WalletApiDeviceIntentSignRequest {
  return {
    account,
    parentAccount: undefined,
    transaction: createTransaction(),
    manifestId: "swap-live-app",
    manifestName: "Swap",
    ...overrides,
  };
}

function createMessageRequest(
  overrides: Partial<WalletApiDeviceIntentSignMessageRequest> &
    Pick<WalletApiDeviceIntentSignMessageRequest, "onSuccess" | "onError" | "onCancel">,
): WalletApiDeviceIntentSignMessageRequest {
  return {
    account,
    parentAccount: undefined,
    message: { standard: undefined, message: "hello" },
    manifestId: "swap-live-app",
    manifestName: "Swap",
    ...overrides,
  };
}

describe("WalletApiSignature desktop integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedExecutorProps = undefined;
  });

  describe("useDeviceIntentSignEnabled", () => {
    it("should activate only when lldWalletApiDeviceIntentSign is enabled and manifest matches", () => {
      const { result: matching } = renderHook(
        () => useDeviceIntentSignAssignment("swap-live-app"),
        {
          initialState: withFlagOverrides({
            lldWalletApiDeviceIntentSign: {
              enabled: true,
              params: { variantId: "variant_a", enabledManifestIds: ["swap-live-app"] },
            },
          }),
        },
      );

      expect(matching.current).toEqual({
        enabled: true,
        variantId: "variant_a",
        active: true,
      });

      const { result: nonMatching } = renderHook(() => useDeviceIntentSignEnabled("earn"), {
        initialState: withFlagOverrides({
          lldWalletApiDeviceIntentSign: {
            enabled: true,
            params: { variantId: "variant_a", enabledManifestIds: ["swap-live-app"] },
          },
        }),
      });

      expect(nonMatching.current).toBe(false);
    });
  });

  describe("TransactionSignatureDialog", () => {
    it("should mount DeviceIntentExecutor and settle onSuccess when the job completes", async () => {
      const onSuccess = jest.fn();
      const onError = jest.fn();
      const onClose = jest.fn();
      const signedOperation = createSignedOperation("op-1");
      const request = createTransactionRequest({
        transaction: createTransaction(ONEINCH_ROUTER),
        onSuccess,
        onError,
      });

      render(<TransactionSignatureDialog request={request} onClose={onClose} />);

      await waitFor(() => expect(screen.getByTestId("device-intent-executor")).toBeVisible());
      expect(capturedExecutorProps?.sourceFlow).toBe("wallet_api");
      expect(capturedExecutorProps?.analyticsProperties).toEqual({
        manifestId: "swap-live-app",
        manifestName: "Swap",
      });
      expect(capturedExecutorProps?.intentComponentExtraProps).toEqual({
        manifestId: "swap-live-app",
        manifestName: "Swap",
        recipient: ONEINCH_ROUTER,
      });

      act(() => {
        capturedExecutorProps?.onIntentJobStateChanged({ type: "signed", signedOperation });
      });
      expect(onSuccess).not.toHaveBeenCalled();

      act(() => {
        capturedExecutorProps?.onIntentJobComplete();
      });

      expect(onSuccess).toHaveBeenCalledWith(signedOperation);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("should reject with UserRefusedOnDevice when user cancels the dialog", async () => {
      const onSuccess = jest.fn();
      const onError = jest.fn();
      const onClose = jest.fn();
      const request = createTransactionRequest({ onSuccess, onError });

      render(<TransactionSignatureDialog request={request} onClose={onClose} />);

      await waitFor(() => expect(screen.getByTestId("device-intent-executor")).toBeVisible());

      act(() => {
        capturedExecutorProps?.onUserCancel();
      });

      expect(onError).toHaveBeenCalledWith(expect.any(UserRefusedOnDevice));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("MessageSignatureDialog", () => {
    it("should mount DeviceIntentExecutor and settle signature or cancel", async () => {
      const onSuccess = jest.fn();
      const onError = jest.fn();
      const onCancel = jest.fn();
      const onClose = jest.fn();
      const request = createMessageRequest({ onSuccess, onError, onCancel });

      render(<MessageSignatureDialog request={request} onClose={onClose} />);

      await waitFor(() => expect(screen.getByTestId("device-intent-executor")).toBeVisible());
      expect(capturedExecutorProps?.sourceFlow).toBe("wallet_api");

      act(() => {
        capturedExecutorProps?.onUserCancel();
      });

      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("SignTransactionIntentComponentLWD", () => {
    it("should display device prompt and provider terms links when signature is requested", async () => {
      const { user } = render(
        <SignTransactionIntentComponentLWD
          jobState={{ type: "device-signature-requested", deviceModelId: DeviceModelId.stax }}
          extraProps={{
            manifestId: "swap-live-app",
            manifestName: "Swap",
            recipient: UNISWAP_ROUTER,
          }}
          onClose={jest.fn()}
        />,
      );

      expect(screen.getByText("Continue on your Ledger Stax")).toBeVisible();
      expect(screen.getByTestId("wallet-api-signature-terms")).toBeVisible();

      const links = screen.getAllByRole("link");
      expect(links).toHaveLength(2);

      await user.click(links[0]);
      await user.click(links[1]);

      expect(openURL).toHaveBeenCalledWith("https://uniswap.org/terms-of-service");
      expect(openURL).toHaveBeenCalledWith("https://uniswap.org/privacy-policy");
    });

    it("should display cancelled InfoState and wire Close and Retry buttons", async () => {
      const retry = jest.fn();
      const onClose = jest.fn();
      const { user } = render(
        <SignTransactionIntentComponentLWD
          jobState={{ type: "cancelled", retry }}
          extraProps={{ manifestId: "swap-live-app", manifestName: "Swap" }}
          onClose={onClose}
        />,
      );

      expect(screen.getByText("Operation rejected on device")).toBeVisible();
      await user.click(screen.getByRole("button", { name: "Retry" }));
      await user.click(screen.getByRole("button", { name: "Close" }));

      expect(retry).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("SignMessageIntentComponentLWD", () => {
    it("should display device prompt on pending and cancelled InfoState on refusal", async () => {
      const retry = jest.fn();
      const onClose = jest.fn();
      const { rerender, user } = render(
        <SignMessageIntentComponentLWD
          jobState={{ type: "pending", deviceModelId: DeviceModelId.europa }}
          extraProps={undefined}
          onClose={onClose}
        />,
      );

      expect(screen.getByText("Continue on your Ledger Flex")).toBeVisible();

      rerender(
        <SignMessageIntentComponentLWD
          jobState={{ type: "cancelled", retry }}
          extraProps={undefined}
          onClose={onClose}
        />,
      );

      expect(screen.getByText("Operation rejected on device")).toBeVisible();
      await user.click(screen.getByRole("button", { name: "Retry" }));
      await user.click(screen.getByRole("button", { name: "Close" }));

      expect(retry).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
