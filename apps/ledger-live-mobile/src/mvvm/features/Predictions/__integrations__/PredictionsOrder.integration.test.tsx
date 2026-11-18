import React from "react";
import { Subject } from "rxjs";
import { act, fireEvent, render, renderHook, screen, waitFor } from "@tests/test-renderer";
import type { QueuedBottomSheetProps } from "@shared/ui-queued-bottom-sheet";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import {
  getWalletApiIdFromAccountId,
  setWalletApiIdForAccountId,
} from "@ledgerhq/live-common/wallet-api/converters";
import {
  runSignTypedDataEvm,
  type SignTypedDataEvmRunState,
} from "@ledgerhq/live-common/wallet-api/Exchange/intents/shared/signTypedDataEvm";
import { PredictionsOrderSheet } from "@features/flow-predictions";
import { usePredictionsHandlers } from "LLM/features/Predictions";
import PredictionsSigningRoot from "../signingIntent/PredictionsSigningRoot";

jest.mock("@ledgerhq/wallet-api-server", () => ({
  ...jest.requireActual("@ledgerhq/wallet-api-server"),
  customWrapper: jest.fn(handler => handler),
}));

// Native bottom sheet primitives, which need a real sheet around them.
jest.mock("@ledgerhq/lumen-ui-rnative", () => {
  const RN = jest.requireActual<typeof import("react-native")>("react-native");
  return {
    ...jest.requireActual("@ledgerhq/lumen-ui-rnative"),
    BottomSheetView: ({ children }: { children?: React.ReactNode }) => (
      <RN.View>{children}</RN.View>
    ),
    BottomSheetScrollView: ({ children }: { children?: React.ReactNode }) => (
      <RN.View>{children}</RN.View>
    ),
    BottomSheetHeader: () => null,
  };
});

jest.mock("@shared/ui-queued-bottom-sheet", () => ({
  ...jest.requireActual("@shared/ui-queued-bottom-sheet"),
  QueuedBottomSheet: (props: QueuedBottomSheetProps) => {
    const { QueuedBottomSheet } = jest.requireActual(
      "@shared/ui-queued-bottom-sheet/testing/module-mock",
    );
    return <QueuedBottomSheet {...props} />;
  },
}));

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ goBack: jest.fn() }),
}));

// No device under Jest: the connection succeeds right away and the Ethereum app is ready. The rest,
// the executor, the signing job, its renderer and the order sheet, is the real one.
jest.mock("@ledgerhq/live-dmk-mobile", () => ({
  ...jest.requireActual("@ledgerhq/live-dmk-mobile"),
  useDeviceManagementKit: () => ({}),
  connectDevice: ({ onConnected }: { onConnected: (result: unknown) => void }) => {
    const { NEVER } = jest.requireActual<typeof import("rxjs")>("rxjs");
    void Promise.resolve().then(() =>
      onConnected({
        // The session stays connected.
        dmk: { getDeviceSessionState: () => NEVER },
        sessionId: "session-1",
        connectedDevice: { modelId: "stax", type: "BLE", name: "Ledger Stax" },
        compatDeviceId: "device-1",
        compatDeviceName: "Lily's Stax",
        compatDeviceWired: false,
      }),
    );
    return NEVER;
  },
}));

jest.mock("@ledgerhq/live-common/device/use-cases/ensureAppReady/ensureAppReadyUseCase", () => ({
  ensureAppReadyUseCase: () => {
    const { of } = jest.requireActual<typeof import("rxjs")>("rxjs");
    const { FinalStateType } = jest.requireActual<typeof import("@ledgerhq/live-dmk-shared")>(
      "@ledgerhq/live-dmk-shared",
    );
    return of({ type: FinalStateType.Success, extractedContext: {} });
  },
}));

jest.mock("@ledgerhq/live-common/wallet-api/Exchange/intents/shared/signTypedDataEvm");

// Signatures of ORDER_TYPED_DATA computed with ethers, by the account's key and by another one.
const OWNER_ADDRESS = "0x19E7E376E7C213B7E7e7e46cc70A5dD086DAff2A";
const OWNER_SIGNATURE =
  "0x3e4e9bdd989a21934fb19e9ffa65070b704c827f9cade19d1a3ed9cb36916bd67ed3195fd3850bfd9de65b96e895ae3d8820500587b76215cb6e9a1d035e97661c";
const OTHER_KEY_SIGNATURE =
  "0x3c881ad12e33995235f7e165941e9ee432d0a07b306ff012655abf169b60b3195cf1c263aae22f9286585b8489298c30a88b0680933fc7e76d697f5cbf6535081b";

const ORDER_TYPED_DATA = {
  domain: { name: "BoxPolymarketPlaceOrder", version: "1", chainId: "137" },
  types: {
    EIP712Domain: [
      { name: "name", type: "string" },
      { name: "version", type: "string" },
      { name: "chainId", type: "uint256" },
    ],
    PlaceOrder: [
      { name: "tokenID", type: "string" },
      { name: "side", type: "string" },
      { name: "orderType", type: "string" },
      { name: "amount", type: "uint256" },
      { name: "tickSize", type: "string" },
      { name: "negRisk", type: "bool" },
      { name: "slippage", type: "uint256" },
      { name: "expiration", type: "uint256" },
    ],
  },
  primaryType: "PlaceOrder",
  message: {
    tokenID: "90234889617199443673709150877675264639",
    side: "BUY",
    orderType: "FOK",
    amount: "2000000",
    tickSize: "0.01",
    negRisk: true,
    slippage: "100",
    expiration: "1790000000",
  },
};

// The order expires a minute after this, within the 300 s MoonPay accepts.
const NOW_MS = 1_789_999_940_000;

const account = {
  ...genAccount("predictions-order", { currency: getCryptoCurrencyById("polygon") }),
  freshAddress: OWNER_ADDRESS,
};

// The device intent executor's sheet, which has no test id of its own.
const EXECUTOR_SHEET = "queued-bottom-sheet";

type Handlers = Record<string, (params?: unknown) => Promise<unknown>>;

function setup() {
  jest.spyOn(Date, "now").mockReturnValue(NOW_MS);
  // One device signing per attempt, so a retry signs again.
  const signings: Subject<SignTypedDataEvmRunState>[] = [];
  jest.mocked(runSignTypedDataEvm).mockClear();
  jest.mocked(runSignTypedDataEvm).mockImplementation(() => {
    const signing = new Subject<SignTypedDataEvmRunState>();
    signings.push(signing);
    return signing;
  });
  setWalletApiIdForAccountId(account.id);
  // Rendered first: a later render replaces what `screen` queries.
  const liveApp = renderHook(() => usePredictionsHandlers() as unknown as Handlers, {
    overrideInitialState: state => ({
      ...state,
      accounts: { ...state.accounts, active: [account] },
    }),
  });
  const view = render(
    <>
      <PredictionsSigningRoot />
      <PredictionsOrderSheet />
    </>,
  );
  let lastOrderId = "1";
  const signOrder = (typedData: unknown = ORDER_TYPED_DATA) => {
    let pending: Promise<unknown> = Promise.resolve();
    act(() => {
      pending = liveApp.result.current["custom.predictions.signOrder"]({
        accountId: getWalletApiIdFromAccountId(account.id),
        typedData: JSON.stringify(typedData),
      });
    });
    return pending.then(answer => {
      lastOrderId = (answer as { orderId: string }).orderId;
      return answer;
    });
  };
  /** Reports for the last signed order unless told otherwise. */
  const reportOrder = (outcome: object, orderId = lastOrderId) =>
    liveApp.result.current["custom.predictions.reportOrder"]({ orderId, ...outcome });
  const device = {
    askToConfirm: () => act(() => signings.at(-1)?.next({ type: "awaiting-confirmation" })),
    sign: (signatureHex: string) =>
      act(() => {
        const signing = signings.at(-1);
        signing?.next({ type: "awaiting-confirmation" });
        signing?.next({ type: "signed", signatureHex });
        signing?.complete();
      }),
    fail: (error: Error) => act(() => signings.at(-1)?.next({ type: "failed", error })),
  };
  const lastSignedOrderId = () => lastOrderId;
  return {
    ...view,
    signOrder,
    reportOrder,
    lastSignedOrderId,
    device,
    closeLiveApp: liveApp.unmount,
  };
}

const preparingTitle = "Preparing the signature";
const isExecutorOpen = () =>
  screen.queryByTestId(EXECUTOR_SHEET)?.props.accessibilityState.expanded === true;
const isOrderOpen = () =>
  screen.getByTestId("predictions-order-sheet").props.accessibilityState.expanded === true;
const rejection = (signing: Promise<unknown>) => signing.catch((error: unknown) => error);

function finishClosingExecutor() {
  fireEvent.press(screen.getByTestId(`${EXECUTOR_SHEET}-hidden`));
}

async function signedOrder() {
  const view = setup();
  const signing = view.signOrder();
  await screen.findByText(preparingTitle);
  view.device.sign(OWNER_SIGNATURE);
  await signing;
  finishClosingExecutor();
  return view;
}

describe("Predictions buy order", () => {
  afterEach(() => jest.restoreAllMocks());

  it("signs the order on the device, answers its signature, and shows it being placed", async () => {
    const { signOrder, device } = setup();

    const signing = signOrder();
    expect(await screen.findByText(preparingTitle)).toBeOnTheScreen();
    device.askToConfirm();
    expect(screen.getByText("Continue on your Ledger Stax")).toBeOnTheScreen();
    device.sign(OWNER_SIGNATURE);

    await expect(signing).resolves.toEqual({
      signature: OWNER_SIGNATURE,
      orderId: expect.any(String),
    });
    await waitFor(() => expect(isExecutorOpen()).toBe(false));
    finishClosingExecutor();
    expect(isOrderOpen()).toBe(true);
    expect(screen.getByText("Placing your order")).toBeOnTheScreen();
  });

  it("shows the filled order, and answers close once the user returns to predictions", async () => {
    const { reportOrder, user } = await signedOrder();

    const report = reportOrder({ outcome: "filled", shares: 3.7, price: 0.54 });

    expect(await screen.findByText("Order filled", {}, { timeout: 3000 })).toBeOnTheScreen();
    expect(screen.getByText("3.7 shares at $0.54")).toBeOnTheScreen();
    await user.press(screen.getByText("Return to predictions"));
    await expect(report).resolves.toEqual({ action: "close" });
    expect(isOrderOpen()).toBe(false);
  });

  it("answers retry when the user tries again on an order that didn't fill", async () => {
    const { reportOrder, user } = await signedOrder();

    const report = reportOrder({ outcome: "not-filled" });

    await user.press(await screen.findByText("Try again", {}, { timeout: 3000 }));
    await expect(report).resolves.toEqual({ action: "retry" });
    expect(isOrderOpen()).toBe(false);
  });

  it("signs a new order once the user tried again, and shows it being placed", async () => {
    const { signOrder, reportOrder, device, user } = await signedOrder();
    const report = reportOrder({ outcome: "not-filled" });
    await user.press(await screen.findByText("Try again", {}, { timeout: 3000 }));
    await report;

    const signing = signOrder();
    expect(await screen.findByText(preparingTitle)).toBeOnTheScreen();
    device.sign(OWNER_SIGNATURE);

    await expect(signing).resolves.toEqual({
      signature: OWNER_SIGNATURE,
      orderId: expect.any(String),
    });
    expect(runSignTypedDataEvm).toHaveBeenCalledTimes(2);
    finishClosingExecutor();
    expect(isOrderOpen()).toBe(true);
    expect(screen.getByText("Placing your order")).toBeOnTheScreen();
  });

  it("answers close to a late report for the order before the retry, leaving the new one placing", async () => {
    const { signOrder, reportOrder, lastSignedOrderId, device, user } = await signedOrder();
    const earlierOrderId = lastSignedOrderId();
    const report = reportOrder({ outcome: "not-filled" });
    await user.press(await screen.findByText("Try again", {}, { timeout: 3000 }));
    await report;

    const signing = signOrder();
    expect(await screen.findByText(preparingTitle)).toBeOnTheScreen();
    device.sign(OWNER_SIGNATURE);
    await signing;

    await expect(reportOrder({ outcome: "filled" }, earlierOrderId)).resolves.toEqual({
      action: "close",
    });
    expect(await screen.findByText("Placing your order")).toBeOnTheScreen();
  });

  it("only offers to close an order MoonPay can't place", async () => {
    const { reportOrder, user } = await signedOrder();

    const report = reportOrder({ outcome: "rejected", reason: "market-closed" });

    expect(
      await screen.findByText("This market is closed.", {}, { timeout: 3000 }),
    ).toBeOnTheScreen();
    expect(screen.queryByText("Try again")).not.toBeOnTheScreen();
    await user.press(screen.getByText("Close"));
    await expect(report).resolves.toEqual({ action: "close" });
  });

  it("answers close right away when no order is open", async () => {
    const { reportOrder } = setup();

    await expect(reportOrder({ outcome: "unconfirmed" })).resolves.toEqual({ action: "close" });
  });

  it("shows a device error with a retry, then signs again", async () => {
    const { signOrder, device, user } = setup();
    const signing = signOrder();
    await screen.findByText(preparingTitle);

    device.fail(
      Object.assign(new Error("Enable blind signing"), { name: "EthAppPleaseEnableContractData" }),
    );
    await user.press(await screen.findByText("Retry"));
    expect(await screen.findByText(preparingTitle)).toBeOnTheScreen();
    device.sign(OWNER_SIGNATURE);

    await expect(signing).resolves.toEqual({
      signature: OWNER_SIGNATURE,
      orderId: expect.any(String),
    });
  });

  it("answers a refusal when the user closes it before signing", async () => {
    const { signOrder } = setup();

    const failure = rejection(signOrder());
    await screen.findByText(preparingTitle);
    fireEvent.press(screen.getByTestId(`${EXECUTOR_SHEET}-header-close`));
    fireEvent.press(screen.getByTestId(`${EXECUTOR_SHEET}-dismiss`));

    expect(await failure).toMatchObject({ name: "UserRefusedOnDevice" });
    expect(isOrderOpen()).toBe(false);
  });

  it("answers a signature from another key with a mismatch, and places nothing", async () => {
    const { signOrder, device } = setup();

    const failure = rejection(signOrder());
    await screen.findByText(preparingTitle);
    device.sign(OTHER_KEY_SIGNATURE);

    expect(await failure).toMatchObject({ name: "PredictionsOrderSignerMismatch" });
    expect(await screen.findByText("This signature doesn't match the account")).toBeOnTheScreen();
    expect(isOrderOpen()).toBe(false);
  });

  it("refuses typed data that isn't a place order without opening anything", async () => {
    const { signOrder } = setup();

    await expect(
      signOrder({ ...ORDER_TYPED_DATA, primaryType: "Permit", domain: { name: "Permit2" } }),
    ).rejects.toMatchObject({ name: "ZodError" });
    expect(isExecutorOpen()).toBe(false);
    expect(runSignTypedDataEvm).not.toHaveBeenCalled();
  });

  it("cancels the signature when its live app closes", async () => {
    const { signOrder, closeLiveApp } = setup();

    const failure = rejection(signOrder());
    await screen.findByText(preparingTitle);
    act(() => closeLiveApp());

    expect(await failure).toMatchObject({ name: "UserRefusedOnDevice" });
    await waitFor(() => expect(isExecutorOpen()).toBe(false));
  });

  it("closes the order and answers close when its live app closes", async () => {
    const { reportOrder, closeLiveApp } = await signedOrder();
    const report = reportOrder({ outcome: "not-filled" });

    act(() => closeLiveApp());

    await expect(report).resolves.toEqual({ action: "close" });
    expect(isOrderOpen()).toBe(false);
  });

  it("refuses an order that already expired without opening anything", async () => {
    const { signOrder } = setup();

    await expect(
      signOrder({
        ...ORDER_TYPED_DATA,
        message: { ...ORDER_TYPED_DATA.message, expiration: String(NOW_MS / 1000 - 1) },
      }),
    ).rejects.toMatchObject({ name: "ZodError" });
    expect(isExecutorOpen()).toBe(false);
  });
});
