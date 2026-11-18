import React from "react";
import { Subject } from "rxjs";
import { act, render, renderHook, screen, waitFor } from "tests/testSetup";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import {
  getWalletApiIdFromAccountId,
  setWalletApiIdForAccountId,
} from "@ledgerhq/live-common/wallet-api/converters";
import {
  runSignTypedDataEvm,
  type SignTypedDataEvmRunState,
} from "@ledgerhq/live-common/wallet-api/Exchange/intents/shared/signTypedDataEvm";
import { PredictionsOrderSheet } from "@features/flow-predictions";
import PredictionsSigningRoot from "../signingIntent/PredictionsSigningRoot";
import { usePredictionsHandlers } from "../hooks/usePredictionsHandlers";

jest.mock("@ledgerhq/wallet-api-server", () => ({
  ...jest.requireActual("@ledgerhq/wallet-api-server"),
  customWrapper: jest.fn(handler => handler),
}));

// No device under Jest: the connection succeeds at once. The rest of the flow is the real one.
jest.mock("@ledgerhq/live-dmk-desktop", () => ({
  ...jest.requireActual<typeof import("@ledgerhq/live-dmk-desktop")>("@ledgerhq/live-dmk-desktop"),
  useDeviceManagementKit: () => ({}),
  connectDevice: ({ onConnected }: { onConnected: (result: unknown) => void }) => {
    const { NEVER } = jest.requireActual<typeof import("rxjs")>("rxjs");
    void Promise.resolve().then(() =>
      onConnected({
        dmk: { getDeviceSessionState: () => NEVER },
        sessionId: "session-1",
        connectedDevice: { modelId: "stax", type: "USB", name: "Ledger Stax" },
        compatDeviceId: "device-1",
        compatDeviceName: "Lily's Stax",
        compatDeviceWired: true,
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

type Handlers = Record<string, (params?: unknown) => Promise<unknown>>;

function setup() {
  jest.spyOn(Date, "now").mockReturnValue(NOW_MS);
  const signings: Subject<SignTypedDataEvmRunState>[] = [];
  jest.mocked(runSignTypedDataEvm).mockImplementation(() => {
    const signing = new Subject<SignTypedDataEvmRunState>();
    signings.push(signing);
    return signing;
  });
  setWalletApiIdForAccountId(account.id);
  const view = render(
    <>
      <PredictionsSigningRoot />
      <PredictionsOrderSheet />
    </>,
    { initialState: { accounts: [account] } },
  );
  const liveApp = renderHook(() => usePredictionsHandlers() as unknown as Handlers, {
    store: view.store,
  });
  let lastWalletOrderId = "1";
  const signOrder = (typedData: unknown = ORDER_TYPED_DATA) => {
    let pending: Promise<unknown> = Promise.resolve();
    act(() => {
      pending = liveApp.result.current["custom.predictions.signOrder"]({
        accountId: getWalletApiIdFromAccountId(account.id),
        typedData: JSON.stringify(typedData),
      });
    });
    return pending.then(answer => {
      lastWalletOrderId = (answer as { walletOrderId: string }).walletOrderId;
      return answer;
    });
  };
  const reportOrder = (report: object, walletOrderId = lastWalletOrderId) =>
    liveApp.result.current["custom.predictions.reportOrder"]({ walletOrderId, ...report });
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
  const lastSignedWalletOrderId = () => lastWalletOrderId;
  return {
    ...view,
    signOrder,
    reportOrder,
    lastSignedWalletOrderId,
    device,
    closeLiveApp: liveApp.unmount,
  };
}

const preparingTitle = "Preparing the signature";
const queryExecutor = () => screen.queryByTestId("device-intent-executor-dialog");
const rejection = (signing: Promise<unknown>) => signing.catch((error: unknown) => error);

async function signedOrder() {
  const view = setup();
  const signing = view.signOrder();
  await screen.findByText(preparingTitle);
  view.device.sign(OWNER_SIGNATURE);
  await signing;
  return view;
}

describe("Predictions buy order", () => {
  it("signs the order on the device, answers its signature, and shows it being placed", async () => {
    const { signOrder, device } = setup();

    const signing = signOrder();
    expect(await screen.findByText(preparingTitle)).toBeVisible();
    device.askToConfirm();
    expect(screen.getByText("Continue on your Ledger Stax")).toBeVisible();
    device.sign(OWNER_SIGNATURE);

    await expect(signing).resolves.toEqual({
      signature: OWNER_SIGNATURE,
      walletOrderId: expect.any(String),
    });
    expect(runSignTypedDataEvm).toHaveBeenCalledWith(
      expect.anything(),
      { ...ORDER_TYPED_DATA, domain: { ...ORDER_TYPED_DATA.domain, chainId: 137 } },
      account.freshAddressPath,
      expect.any(String),
    );
    await waitFor(() => expect(queryExecutor()).not.toBeInTheDocument());
    expect(await screen.findByText("Placing your order")).toBeVisible();
  });

  it("shows the filled order, and answers close once the user returns to predictions", async () => {
    const { reportOrder, user } = await signedOrder();

    const report = reportOrder({ status: "filled", shares: 3.7, price: 0.54 });

    expect(await screen.findByText("Order filled", {}, { timeout: 3000 })).toBeVisible();
    expect(screen.getByText("3.7 shares at $0.54")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Return to predictions" }));
    await expect(report).resolves.toEqual({ action: "close" });
  });

  it("answers retry when the user tries again on an order that didn't fill", async () => {
    const { reportOrder, user } = await signedOrder();

    const report = reportOrder({ status: "not-filled" });

    await user.click(await screen.findByRole("button", { name: "Try again" }, { timeout: 3000 }));
    await expect(report).resolves.toEqual({ action: "retry" });
    await waitFor(() => expect(screen.queryByText("Order not filled")).not.toBeInTheDocument());
  });

  it("signs a new order once the user tried again, and shows it being placed", async () => {
    const { signOrder, reportOrder, device, user } = await signedOrder();
    const report = reportOrder({ status: "not-filled" });
    await user.click(await screen.findByRole("button", { name: "Try again" }, { timeout: 3000 }));
    await report;

    const signing = signOrder();
    expect(await screen.findByText(preparingTitle)).toBeVisible();
    device.sign(OWNER_SIGNATURE);

    await expect(signing).resolves.toEqual({
      signature: OWNER_SIGNATURE,
      walletOrderId: expect.any(String),
    });
    expect(runSignTypedDataEvm).toHaveBeenCalledTimes(2);
    expect(await screen.findByText("Placing your order")).toBeVisible();
  });

  it("answers close to a late report for the order before the retry, leaving the new one placing", async () => {
    const { signOrder, reportOrder, lastSignedWalletOrderId, device, user } = await signedOrder();
    const earlierWalletOrderId = lastSignedWalletOrderId();
    const report = reportOrder({ status: "not-filled" });
    await user.click(await screen.findByRole("button", { name: "Try again" }, { timeout: 3000 }));
    await report;

    const signing = signOrder();
    expect(await screen.findByText(preparingTitle)).toBeVisible();
    device.sign(OWNER_SIGNATURE);
    await signing;

    await expect(reportOrder({ status: "filled" }, earlierWalletOrderId)).resolves.toEqual({
      action: "close",
    });
    expect(screen.getByText("Placing your order")).toBeVisible();
  });

  it("only offers to close an order MoonPay can't place", async () => {
    const { reportOrder, user } = await signedOrder();

    const report = reportOrder({ status: "rejected", reason: "market-closed" });

    expect(await screen.findByText("This market is closed.", {}, { timeout: 3000 })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Close" }).at(-1) as HTMLElement);
    await expect(report).resolves.toEqual({ action: "close" });
  });

  it("closes the order and answers close when its live app closes", async () => {
    const { reportOrder, closeLiveApp } = await signedOrder();
    const report = reportOrder({ status: "not-filled" });
    await screen.findByText("Placing your order");

    act(() => closeLiveApp());

    await expect(report).resolves.toEqual({ action: "close" });
    await waitFor(() => expect(screen.queryByText("Placing your order")).not.toBeInTheDocument());
  });

  it("opens no order when its live app closes as the device signs", async () => {
    const { signOrder, device, closeLiveApp } = setup();
    const signing = signOrder();
    await screen.findByText(preparingTitle);

    device.sign(OWNER_SIGNATURE);
    act(() => closeLiveApp());
    await rejection(signing);

    expect(screen.queryByText("Placing your order")).not.toBeInTheDocument();
  });

  it("answers close right away when no order is open", async () => {
    const { reportOrder } = setup();

    await expect(reportOrder({ status: "unconfirmed" })).resolves.toEqual({ action: "close" });
  });

  it("closes without signing when the order expired before the retry, rejecting it as expired", async () => {
    const { signOrder, device, user } = setup();
    const failure = rejection(signOrder());
    await screen.findByText(preparingTitle);
    device.fail(
      Object.assign(new Error("Enable blind signing"), { name: "EthAppPleaseEnableContractData" }),
    );
    const retry = await screen.findByRole("button", { name: "Retry" });

    jest.spyOn(Date, "now").mockReturnValue(NOW_MS + 2 * 60 * 1000);
    await user.click(retry);

    expect(await failure).toMatchObject({ name: "PredictionsOrderExpired" });
    expect(runSignTypedDataEvm).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(queryExecutor()).not.toBeInTheDocument());
    expect(screen.queryByText("Placing your order")).not.toBeInTheDocument();
  });

  it("shows a device error with a retry, then signs again", async () => {
    const { signOrder, device, user } = setup();
    const signing = signOrder();
    await screen.findByText(preparingTitle);

    device.fail(
      Object.assign(new Error("Enable blind signing"), { name: "EthAppPleaseEnableContractData" }),
    );
    await user.click(await screen.findByRole("button", { name: "Retry" }));
    expect(await screen.findByText(preparingTitle)).toBeVisible();
    device.sign(OWNER_SIGNATURE);

    await expect(signing).resolves.toEqual({
      signature: OWNER_SIGNATURE,
      walletOrderId: expect.any(String),
    });
  });

  it("answers a refusal when the user closes it before signing", async () => {
    const { signOrder, user } = setup();

    const failure = rejection(signOrder());
    await screen.findByText(preparingTitle);
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(await failure).toMatchObject({ name: "UserRefusedOnDevice" });
    await waitFor(() => expect(queryExecutor()).not.toBeInTheDocument());
    expect(screen.queryByText("Placing your order")).not.toBeInTheDocument();
  });

  it("answers a signature from another key with a mismatch, and places nothing", async () => {
    const { signOrder, device } = setup();

    const failure = rejection(signOrder());
    await screen.findByText(preparingTitle);
    device.sign(OTHER_KEY_SIGNATURE);

    expect(await failure).toMatchObject({ name: "PredictionsOrderSignerMismatch" });
    expect(await screen.findByText("This signature doesn't match the account")).toBeVisible();
    expect(screen.queryByText("Placing your order")).not.toBeInTheDocument();
  });

  it("refuses typed data that isn't a place order without opening anything", async () => {
    const { signOrder } = setup();

    await expect(
      signOrder({ ...ORDER_TYPED_DATA, primaryType: "Permit", domain: { name: "Permit2" } }),
    ).rejects.toMatchObject({ name: "ZodError" });
    expect(queryExecutor()).not.toBeInTheDocument();
    expect(runSignTypedDataEvm).not.toHaveBeenCalled();
  });

  it("cancels the signature when its live app closes", async () => {
    const { signOrder, closeLiveApp } = setup();

    const failure = rejection(signOrder());
    await screen.findByText(preparingTitle);
    act(() => closeLiveApp());

    expect(await failure).toMatchObject({ name: "UserRefusedOnDevice" });
    await waitFor(() => expect(queryExecutor()).not.toBeInTheDocument());
  });

  it("refuses an order that already expired without opening anything", async () => {
    const { signOrder } = setup();

    await expect(
      signOrder({
        ...ORDER_TYPED_DATA,
        message: { ...ORDER_TYPED_DATA.message, expiration: String(NOW_MS / 1000 - 1) },
      }),
    ).rejects.toMatchObject({ name: "ZodError" });
    expect(queryExecutor()).not.toBeInTheDocument();
  });
});
