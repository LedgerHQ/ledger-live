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
import { PredictionsSetupSheet } from "@features/flow-predictions";
import PredictionsBindingRoot from "../bindingIntent/PredictionsBindingRoot";
import { usePredictionsHandlers } from "../hooks/usePredictionsHandlers";

jest.mock("@ledgerhq/wallet-api-server", () => ({
  ...jest.requireActual("@ledgerhq/wallet-api-server"),
  customWrapper: jest.fn(handler => handler),
}));

// No device under Jest: the connection succeeds right away and the Ethereum app is ready. The rest,
// the executor, the binding job, its renderer and the setup dialog, is the real one.
jest.mock("@ledgerhq/live-dmk-desktop", () => ({
  ...jest.requireActual<typeof import("@ledgerhq/live-dmk-desktop")>("@ledgerhq/live-dmk-desktop"),
  useDeviceManagementKit: () => ({}),
  connectDevice: ({ onConnected }: { onConnected: (result: unknown) => void }) => {
    const { NEVER } = jest.requireActual<typeof import("rxjs")>("rxjs");
    void Promise.resolve().then(() =>
      onConnected({
        // The session stays connected.
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

// The account's key signs the binding message of its address; signatures computed with ethers.
const OWNER_ADDRESS = "0x19E7E376E7C213B7E7e7e46cc70A5dD086DAff2A";
const OWNER_SIGNATURE =
  "0x5070512975e65565cd35d3b151be4f4ad856f92d8226d8d365f4c51f4c87edf94da11308979ebfc2cd941ecd4338fd8dc8232332b7e30d1e8529f5c958e6b67e1c";
const OTHER_KEY_SIGNATURE =
  "0x05ef3689708c7e9182ca339900f52ce7c551c1eb6de06c26388814346eeb5f4453533a433c2224e230fb120f1e94b1c3de524216d5157afdbfd07afb54ca417b1b";

const account = {
  ...genAccount("predictions-binding", { currency: getCryptoCurrencyById("polygon") }),
  freshAddress: OWNER_ADDRESS,
};

type Handlers = Record<string, (params?: unknown) => Promise<unknown>>;

function setup() {
  // One device signing per attempt, so a retry signs again.
  const signings: Subject<SignTypedDataEvmRunState>[] = [];
  jest.mocked(runSignTypedDataEvm).mockImplementation(() => {
    const signing = new Subject<SignTypedDataEvmRunState>();
    signings.push(signing);
    return signing;
  });
  setWalletApiIdForAccountId(account.id);
  const view = render(
    <>
      <PredictionsBindingRoot />
      <PredictionsSetupSheet />
    </>,
    { initialState: { accounts: [account] } },
  );
  const liveApp = renderHook(() => usePredictionsHandlers() as unknown as Handlers, {
    store: view.store,
  });
  const bindAccount = (accountId = getWalletApiIdFromAccountId(account.id)) => {
    let pending: Promise<unknown> = Promise.resolve();
    act(() => {
      pending = liveApp.result.current["custom.predictions.bindAccount"]({ accountId });
    });
    return pending;
  };
  const reportSetup = (setup: unknown) =>
    liveApp.result.current["custom.predictions.reportSetup"](setup);
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
  return { ...view, bindAccount, reportSetup, device, closeLiveApp: liveApp.unmount };
}

const preparingTitle = "Preparing the signature";
const promptTitle = "Confirm account ownership on your Ledger Stax";
const queryExecutor = () => screen.queryByTestId("device-intent-executor-dialog");
const refusal = (binding: Promise<unknown>) => binding.catch((error: unknown) => error);

describe("Predictions account binding", () => {
  it("signs the binding of the picked account on the device, answers it, and hands over to the setup", async () => {
    const { bindAccount, device } = setup();

    const binding = bindAccount();
    expect(await screen.findByText(preparingTitle)).toBeVisible();
    device.askToConfirm();
    expect(screen.getByText(promptTitle)).toBeVisible();
    device.sign(OWNER_SIGNATURE);

    await expect(binding).resolves.toMatchObject({
      typedData: { primaryType: "ConfirmAccountOwnership", message: { account: OWNER_ADDRESS } },
      signature: OWNER_SIGNATURE,
    });
    await waitFor(() => expect(queryExecutor()).not.toBeInTheDocument());
    expect(await screen.findByText("Setting up your trading account")).toBeVisible();
  });

  it("shows the setup the live app reports, and answers once the user continues", async () => {
    const { bindAccount, reportSetup, device, user } = setup();
    const binding = bindAccount();
    await screen.findByText(preparingTitle);
    device.sign(OWNER_SIGNATURE);
    await binding;
    let isReported = false;

    void reportSetup({ outcome: "found" }).then(() => {
      isReported = true;
    });

    expect(await screen.findByText("Trading account found", {}, { timeout: 3000 })).toBeVisible();
    expect(isReported).toBe(false);
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() => expect(isReported).toBe(true));
  });

  it("answers a signature from another key with a mismatch, says so, and closes when the user leaves", async () => {
    const { bindAccount, device, user } = setup();

    const failure = refusal(bindAccount());
    await screen.findByText(preparingTitle);
    device.sign(OTHER_KEY_SIGNATURE);

    expect(await failure).toMatchObject({ name: "PredictionsBindingSignerMismatch" });
    expect(await screen.findByText("This signature doesn't match the account")).toBeVisible();
    expect(screen.queryByText("Setting up your trading account")).not.toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Close" }).at(-1) as HTMLElement);
    await waitFor(() => expect(queryExecutor()).not.toBeInTheDocument());
  });

  it("shows a device error with a retry, then signs again", async () => {
    const { bindAccount, device, user } = setup();
    const binding = bindAccount();
    await screen.findByText(preparingTitle);

    device.fail(
      Object.assign(new Error("Enable blind signing"), { name: "EthAppPleaseEnableContractData" }),
    );
    await user.click(await screen.findByRole("button", { name: "Retry" }));
    expect(await screen.findByText(preparingTitle)).toBeVisible();
    device.sign(OWNER_SIGNATURE);

    await expect(binding).resolves.toMatchObject({ signature: OWNER_SIGNATURE });
  });

  it("can't be closed while the device asks to confirm", async () => {
    const { bindAccount, device, user } = setup();
    const binding = bindAccount();
    await screen.findByText(preparingTitle);

    device.askToConfirm();
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(queryExecutor()).toBeVisible();
    device.sign(OWNER_SIGNATURE);
    await expect(binding).resolves.toMatchObject({ signature: OWNER_SIGNATURE });
  });

  it("answers a refusal when the user closes it before signing", async () => {
    const { bindAccount, user } = setup();

    const failure = refusal(bindAccount());
    await screen.findByText(preparingTitle);
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(await failure).toMatchObject({ name: "UserRefusedOnDevice" });
    await waitFor(() => expect(queryExecutor()).not.toBeInTheDocument());
  });

  it("answers a refusal to a binding replaced by a new one, and binds the new one", async () => {
    const { bindAccount, device } = setup();

    const replaced = refusal(bindAccount());
    await screen.findByText(preparingTitle);
    const binding = bindAccount();

    expect(await replaced).toMatchObject({ name: "UserRefusedOnDevice" });
    await screen.findByText(preparingTitle);
    device.sign(OWNER_SIGNATURE);
    await expect(binding).resolves.toMatchObject({ signature: OWNER_SIGNATURE });
  });

  it("cancels the binding when its live app closes", async () => {
    const { bindAccount, closeLiveApp } = setup();

    const failure = refusal(bindAccount());
    await screen.findByText(preparingTitle);
    act(() => closeLiveApp());

    expect(await failure).toMatchObject({ name: "UserRefusedOnDevice" });
    await waitFor(() => expect(queryExecutor()).not.toBeInTheDocument());
  });

  it("closes the trading wallet setup when its live app closes", async () => {
    const { bindAccount, device, closeLiveApp } = setup();
    const binding = bindAccount();
    await screen.findByText(preparingTitle);
    device.sign(OWNER_SIGNATURE);
    await binding;
    await screen.findByText("Setting up your trading account");

    act(() => closeLiveApp());

    await waitFor(() =>
      expect(screen.queryByText("Setting up your trading account")).not.toBeInTheDocument(),
    );
  });

  it("answers a refusal to an open binding when the binding root unmounts", async () => {
    const { bindAccount, unmount } = setup();

    const failure = refusal(bindAccount());
    await screen.findByText(preparingTitle);
    unmount();

    expect(await failure).toMatchObject({ name: "UserRefusedOnDevice" });
  });

  it("rejects an unknown account without opening anything", async () => {
    const { bindAccount } = setup();

    await expect(bindAccount("unknown")).rejects.toMatchObject({
      name: "PredictionsBindingAccountNotFound",
    });
    expect(queryExecutor()).not.toBeInTheDocument();
  });
});
