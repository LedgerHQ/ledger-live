/**
 * @jest-environment jsdom
 */
import React from "react";
import { act, render, screen, waitFor, withFlagOverrides } from "tests/testSetup";
import type { Intent } from "@features/platform-device-intent";
import type {
  LedgerSyncFailureReason,
  LedgerSyncJobState,
} from "@features/platform-intent-wallet-sync";
import {
  type Trustchain,
  type TrustchainResult,
  TrustchainResultType,
} from "@ledgerhq/ledger-key-ring-protocol/types";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { setDrawerVisibility, setFlow } from "~/renderer/actions/walletSync";
import { useDispatch } from "LLD/hooks/redux";
import { Flow, initialStateWalletSync, Step } from "~/renderer/reducers/walletSync";
import { LedgerSyncDeviceIntentExecutorLWD } from "../deviceIntents/LedgerSyncDeviceIntentExecutorLWD";
import { buildDeviceConnection } from "../deviceIntents/__tests__/ledgerSyncIntentTestKit";
import { addMemberIntentLWDDefinition } from "../deviceIntents/addMemberIntent/intentLWDDefinition";
import { removeMemberIntentLWDDefinition } from "../deviceIntents/removeMemberIntent/intentLWDDefinition";
import { AnalyticsPage } from "../hooks/useLedgerSyncAnalytics";
import { useFlows } from "../hooks/useFlows";
import WalletSyncDrawer from "../components/Drawer";
import OpenOrInstallTrustChainApp from "../screens/DeviceActions/openOrInstall";
import { INSTANCES, lldWalletSyncFeatureFlag } from "./shared";

jest.mock("../deviceIntents/LedgerSyncDeviceIntentExecutorLWD", () => ({
  LedgerSyncDeviceIntentExecutorLWD: jest.fn(() =>
    jest.requireActual<typeof import("react")>("react").createElement("div", {
      "data-testid": "device-intent-dialog",
    }),
  ),
}));

jest.mock("../deviceIntents/useCreateSessionSdk", () => ({
  useCreateSessionSdk: () => mockCreateSessionSdk,
}));

jest.mock("../screens/DeviceActions/openOrInstall", () => jest.fn(() => null));

jest.mock("../hooks/useGetMembers", () => ({
  useGetMembers: () => ({ isMembersLoading: false, instances: INSTANCES, isError: false }),
}));

const mockCreateSessionSdk = jest.fn();

type AnyLedgerSyncIntent = Intent<LedgerSyncJobState, unknown, undefined, unknown>;
type WalletSyncState = typeof initialStateWalletSync;

const MEMBER_CREDENTIALS = { pubkey: "currentInstance", privatekey: "privatekey" };
const TRUSTCHAIN: Trustchain = {
  rootId: "rootId",
  applicationPath: "m/0'/16'/0'",
  walletSyncEncryptionKey: "key",
};
const NEW_TRUSTCHAIN: Trustchain = { ...TRUSTCHAIN, walletSyncEncryptionKey: "rotated" };
const MEMBER_TO_REMOVE = INSTANCES[1];
// The side panel keeps its content mounted for its exit animation.
const PANEL_EXIT = { timeout: 3000 };

function mountedIntents(): AnyLedgerSyncIntent[] {
  return jest
    .mocked(LedgerSyncDeviceIntentExecutorLWD)
    .mock.calls.map(([props]) => props.intent as AnyLedgerSyncIntent);
}

function lastMountedProps() {
  const props = jest.mocked(LedgerSyncDeviceIntentExecutorLWD).mock.calls.at(-1)?.[0];
  if (!props) throw new Error("The Ledger Sync intent executor was not mounted");
  return props;
}

function lastIntent(): AnyLedgerSyncIntent {
  return lastMountedProps().intent as AnyLedgerSyncIntent;
}

function emit(jobState: LedgerSyncJobState, intent = lastIntent()) {
  act(() => intent.onJobStateChanged?.(jobState));
}

function deliver(result: unknown, intent = lastIntent()) {
  act(() => intent.onResult?.(result));
}

function failed(reason: LedgerSyncFailureReason): LedgerSyncJobState {
  return { type: "failed", reason, error: new Error(`Ledger Sync ${reason}`) };
}

function deviceIntentDialog() {
  return screen.queryByTestId("device-intent-dialog");
}

function sidePanel() {
  return screen.queryByTestId("drawer-content");
}

async function expectDeviceStepWithoutPanel() {
  expect(await screen.findByTestId("device-intent-dialog")).toBeInTheDocument();
  await waitFor(() => expect(sidePanel()).not.toBeInTheDocument(), PANEL_EXIT);
}

function expectPanelWithoutDeviceStep() {
  expect(sidePanel()).toBeInTheDocument();
  expect(deviceIntentDialog()).not.toBeInTheDocument();
}

type RenderDrawerOptions = {
  dieEnabled?: boolean;
  currentPage?: AnalyticsPage;
  walletSync?: Partial<WalletSyncState>;
  trustchain?: Trustchain | null;
  children?: React.ReactNode;
};

function renderDrawer({
  dieEnabled = true,
  currentPage = AnalyticsPage.LedgerSyncSettings,
  walletSync = {},
  trustchain = null,
  children,
}: RenderDrawerOptions = {}) {
  return render(
    <>
      {children}
      <WalletSyncDrawer currentPage={currentPage} onClose={jest.fn()} />
    </>,
    {
      initialState: {
        ...withFlagOverrides({
          ...lldWalletSyncFeatureFlag,
          lwdLedgerSyncDie: { enabled: dieEnabled },
        }),
        walletSync: {
          ...initialStateWalletSync,
          isDrawerOpen: true,
          flow: Flow.Activation,
          step: Step.DeviceAction,
          ...walletSync,
        },
        trustchain: { trustchain, memberCredentials: MEMBER_CREDENTIALS },
      },
    },
  );
}

/** Activation from Settings: the panel is open on the first step, then the device step starts. */
async function startActivationFromSettings() {
  const view = renderDrawer({ walletSync: { step: Step.CreateOrSynchronize } });
  expectPanelWithoutDeviceStep();
  act(() => {
    view.store.dispatch(setFlow({ flow: Flow.Activation, step: Step.DeviceAction }));
  });
  await expectDeviceStepWithoutPanel();
  return view;
}

async function startRemoval() {
  const view = renderDrawer({
    walletSync: {
      flow: Flow.ManageInstances,
      step: Step.SynchronizedInstances,
      instances: INSTANCES,
    },
    trustchain: TRUSTCHAIN,
  });
  expectPanelWithoutDeviceStep();
  await view.user.click((await screen.findAllByText("Remove"))[1]);
  await expectDeviceStepWithoutPanel();
  return view;
}

function OnboardingEntry() {
  const dispatch = useDispatch();
  const { goToWelcomeScreenWalletSync } = useFlows();
  const open = () => {
    goToWelcomeScreenWalletSync(true);
    dispatch(setDrawerVisibility(true));
  };
  return <button onClick={open}>open</button>;
}

describe("Ledger Sync device steps on DIE", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // The side panel portals into #modals, which must exist when it first renders.
    const modals = document.createElement("div");
    modals.id = "modals";
    document.body.appendChild(modals);
  });

  afterEach(() => {
    document.getElementById("modals")?.remove();
  });

  describe("activation", () => {
    it.each([
      [TrustchainResultType.created, Step.ActivationFinal, true],
      [TrustchainResultType.restored, Step.SynchronizationFinal, false],
    ])(
      "should store the trustchain and bring the panel back on the final step after a %s trustchain",
      async (type, nextStep, hasTrustchainBeenCreated) => {
        const { store } = await startActivationFromSettings();

        expect(OpenOrInstallTrustChainApp).not.toHaveBeenCalled();
        const intent = lastIntent();
        expect(intent.label).toBe(addMemberIntentLWDDefinition.label);
        expect(intent.input).toEqual({
          memberCredentials: MEMBER_CREDENTIALS,
          currentTrustchain: undefined,
          createSessionSdk: mockCreateSessionSdk,
        });

        const result: TrustchainResult = { type, trustchain: TRUSTCHAIN };
        deliver(result);
        expect(store.getState().trustchain.trustchain).toEqual(TRUSTCHAIN);
        expect(store.getState().walletSync.step).toBe(Step.DeviceAction);

        emit({ type: "completed" });
        expect(store.getState().walletSync).toMatchObject({
          flow: Flow.Activation,
          step: Step.ActivationLoading,
          nextStep,
          hasTrustchainBeenCreated,
          isDrawerOpen: true,
        });
        expectPanelWithoutDeviceStep();
      },
    );

    it.each([
      ["already-secured-same-seed", Step.AlreadySecuredSameSeed],
      ["already-secured-other-seed", Step.AlreadySecuredOtherSeed],
      ["no-trustchain", Step.UnbackedError],
    ] as const)(
      "should bring the panel back on the step of the %s failure",
      async (reason, step) => {
        const { store } = await startActivationFromSettings();

        emit(failed(reason));

        expect(store.getState().walletSync).toMatchObject({ flow: Flow.Synchronize, step });
        expectPanelWithoutDeviceStep();
      },
    );

    it.each(["unknown", "not-allowed"] as const)(
      "should bring the panel back with the %s failure and hide it again for the retry",
      async reason => {
        const { store, user } = await startActivationFromSettings();
        const firstIntent = lastIntent();

        emit(failed(reason));

        expect(store.getState().walletSync.step).toBe(Step.DeviceAction);
        const retry = await screen.findByRole("button", { name: /retry/i });
        expectPanelWithoutDeviceStep();

        await user.click(retry);

        await expectDeviceStepWithoutPanel();
        expect(lastIntent().uuid).not.toBe(firstIntent.uuid);
        expect(lastIntent().label).toBe(addMemberIntentLWDDefinition.label);
      },
    );

    it("should start a new run when the device step is visited again after a failure", async () => {
      const { store } = await startActivationFromSettings();
      emit(failed("unknown"));
      await screen.findByRole("button", { name: /retry/i });

      act(() => {
        store.dispatch(setFlow({ flow: Flow.Activation, step: Step.CreateOrSynchronize }));
      });
      act(() => {
        store.dispatch(setFlow({ flow: Flow.Activation, step: Step.DeviceAction }));
      });

      await expectDeviceStepWithoutPanel();
    });

    it("should keep the run open after a device rejection and finish it after the retry", async () => {
      const { store } = await startActivationFromSettings();
      const intent = lastIntent();

      emit({ type: "device-rejected", error: new Error("UserRefusedOnDevice"), retry: jest.fn() });
      expect(store.getState().walletSync.step).toBe(Step.DeviceAction);
      expect(deviceIntentDialog()).toBeInTheDocument();

      emit({ type: "pending" });
      deliver({ type: TrustchainResultType.created, trustchain: TRUSTCHAIN });
      emit({ type: "completed" });

      expect(new Set(mountedIntents().map(({ uuid }) => uuid))).toEqual(new Set([intent.uuid]));
      expect(store.getState().walletSync.step).toBe(Step.ActivationLoading);
    });

    it("should bring the panel back on the first step when the user leaves the executor", async () => {
      const { store } = await startActivationFromSettings();

      act(() => lastMountedProps().onUserCancel());

      expect(store.getState().walletSync).toMatchObject({
        step: Step.CreateOrSynchronize,
        isDrawerOpen: true,
      });
      expectPanelWithoutDeviceStep();
    });

    it("should keep the drawer on Escape while the device step runs", async () => {
      const { store, user } = await startActivationFromSettings();

      await user.keyboard("{Escape}");

      expect(store.getState().walletSync.isDrawerOpen).toBe(true);
      expect(deviceIntentDialog()).toBeInTheDocument();
    });

    it("should restore the known trustchain instead of creating one", async () => {
      renderDrawer({ trustchain: TRUSTCHAIN });

      await expectDeviceStepWithoutPanel();
      expect(lastIntent().input).toMatchObject({ currentTrustchain: TRUSTCHAIN });
    });
  });

  describe("onboarding", () => {
    it("should run the DIE step without the panel from a new device onboarding and close the drawer once done", async () => {
      const { store, user } = renderDrawer({
        currentPage: AnalyticsPage.Onboarding,
        walletSync: { step: Step.CreateOrSynchronize, isDrawerOpen: false },
        children: <OnboardingEntry />,
      });
      await user.click(screen.getByRole("button", { name: "open" }));

      expect(store.getState().walletSync).toMatchObject({
        step: Step.DeviceAction,
        onboardingNewDevice: true,
      });
      await expectDeviceStepWithoutPanel();
      expect(lastIntent().label).toBe(addMemberIntentLWDDefinition.label);

      deliver({ type: TrustchainResultType.created, trustchain: TRUSTCHAIN });
      emit({ type: "completed" });

      expect(store.getState().trustchain.trustchain).toEqual(TRUSTCHAIN);
      expect(store.getState().walletSync.isDrawerOpen).toBe(false);
      expect(store.getState().settings.hasCompletedOnboarding).toBe(false);
      expect(deviceIntentDialog()).not.toBeInTheDocument();
    });

    it("should complete the onboarding with the connected device outside a new device onboarding", async () => {
      const { store } = renderDrawer({ currentPage: AnalyticsPage.Onboarding });
      await expectDeviceStepWithoutPanel();

      act(() =>
        lastMountedProps().onExecutorStateChanged?.({
          type: "initializingDeviceContext",
          connectionResult: buildDeviceConnection("session-1"),
        }),
      );
      deliver({ type: TrustchainResultType.created, trustchain: TRUSTCHAIN });
      emit({ type: "completed" });

      expect(store.getState().settings).toMatchObject({
        hasCompletedOnboarding: true,
        lastOnboardedDevice: {
          deviceId: "compat-1",
          deviceName: "Ledger Stax",
          modelId: DeviceModelId.stax,
          wired: true,
        },
      });
      expect(store.getState().walletSync.isDrawerOpen).toBe(false);
    });
  });

  describe("instance removal", () => {
    it("should store the rotated trustchain and bring the panel back on the deletion success", async () => {
      const { store } = await startRemoval();

      expect(OpenOrInstallTrustChainApp).not.toHaveBeenCalled();
      expect(lastIntent().label).toBe(removeMemberIntentLWDDefinition.label);
      expect(lastIntent().input).toEqual({
        trustchain: TRUSTCHAIN,
        memberCredentials: MEMBER_CREDENTIALS,
        member: MEMBER_TO_REMOVE,
        createSessionSdk: mockCreateSessionSdk,
      });

      deliver(NEW_TRUSTCHAIN);
      emit({ type: "completed" });

      expect(store.getState().trustchain.trustchain).toEqual(NEW_TRUSTCHAIN);
      expect(store.getState().walletSync.step).toBe(Step.InstanceSuccesfullyDeleted);
      expectPanelWithoutDeviceStep();
      expect(await screen.findByText(new RegExp(MEMBER_TO_REMOVE.name))).toBeInTheDocument();
    });

    it("should bring the panel back on the unsecured ledger step after a not-allowed failure", async () => {
      const { store } = await startRemoval();

      emit(failed("not-allowed"));

      expect(store.getState().walletSync.step).toBe(Step.UnsecuredLedger);
      expectPanelWithoutDeviceStep();
    });

    it("should bring the panel back with any other failure and hide it again for the retry", async () => {
      const { store, user } = await startRemoval();
      const firstIntent = lastIntent();

      emit(failed("unknown"));

      expect(store.getState().walletSync.step).toBe(Step.DeviceActionInstance);
      const retry = await screen.findByRole("button", { name: /retry/i });
      expectPanelWithoutDeviceStep();

      await user.click(retry);

      await expectDeviceStepWithoutPanel();
      expect(lastIntent().uuid).not.toBe(firstIntent.uuid);
      expect(lastIntent().input).toMatchObject({ member: MEMBER_TO_REMOVE });
    });

    it("should bring the panel back on the instance list when the user leaves the executor", async () => {
      const { store } = await startRemoval();

      act(() => lastMountedProps().onUserCancel());

      expect(store.getState().walletSync.step).toBe(Step.SynchronizedInstances);
      expectPanelWithoutDeviceStep();
    });
  });

  describe("flag off", () => {
    it("should keep the legacy device step in the panel and close the drawer on Escape", async () => {
      const { store, user } = renderDrawer({ dieEnabled: false });

      expect(sidePanel()).toBeInTheDocument();
      expect(OpenOrInstallTrustChainApp).toHaveBeenCalled();
      expect(LedgerSyncDeviceIntentExecutorLWD).not.toHaveBeenCalled();

      await user.keyboard("{Escape}");

      expect(store.getState().walletSync.isDrawerOpen).toBe(false);
    });
  });
});
