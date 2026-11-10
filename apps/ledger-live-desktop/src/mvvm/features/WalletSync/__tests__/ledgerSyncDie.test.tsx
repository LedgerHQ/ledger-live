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
import { Flow, initialStateWalletSync, Step } from "~/renderer/reducers/walletSync";
import { LedgerSyncDeviceIntentExecutorLWD } from "../deviceIntents/LedgerSyncDeviceIntentExecutorLWD";
import { buildDeviceConnection } from "../deviceIntents/__tests__/ledgerSyncIntentTestKit";
import { addMemberIntentLWDDefinition } from "../deviceIntents/addMemberIntent/intentLWDDefinition";
import { removeMemberIntentLWDDefinition } from "../deviceIntents/removeMemberIntent/intentLWDDefinition";
import { AnalyticsPage } from "../hooks/useLedgerSyncAnalytics";
import { useFlows } from "../hooks/useFlows";
import WalletSyncActivation from "../screens/Activation";
import WalletSyncManageInstances from "../screens/ManageInstances";
import OpenOrInstallTrustChainApp from "../screens/DeviceActions/openOrInstall";
import { INSTANCES, lldWalletSyncFeatureFlag } from "./shared";

jest.mock("../deviceIntents/LedgerSyncDeviceIntentExecutorLWD", () => ({
  LedgerSyncDeviceIntentExecutorLWD: jest.fn(() => null),
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

const MEMBER_CREDENTIALS = { pubkey: "currentInstance", privatekey: "privatekey" };
const TRUSTCHAIN: Trustchain = {
  rootId: "rootId",
  applicationPath: "m/0'/16'/0'",
  walletSyncEncryptionKey: "key",
};
const NEW_TRUSTCHAIN: Trustchain = { ...TRUSTCHAIN, walletSyncEncryptionKey: "rotated" };
const MEMBER_TO_REMOVE = INSTANCES[1];

const dieFlagOn = withFlagOverrides({
  ...lldWalletSyncFeatureFlag,
  lwdLedgerSyncDie: { enabled: true },
});

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

function renderActivation(
  sourcePage: AnalyticsPage = AnalyticsPage.LedgerSyncSettings,
  walletSync: Partial<typeof initialStateWalletSync> = {},
) {
  return render(<WalletSyncActivation sourcePage={sourcePage} />, {
    initialState: {
      ...dieFlagOn,
      walletSync: {
        ...initialStateWalletSync,
        flow: Flow.Activation,
        step: Step.DeviceAction,
        ...walletSync,
      },
      trustchain: { trustchain: null, memberCredentials: MEMBER_CREDENTIALS },
    },
  });
}

function renderInstanceRemoval() {
  return render(<WalletSyncManageInstances />, {
    initialState: {
      ...dieFlagOn,
      walletSync: {
        ...initialStateWalletSync,
        flow: Flow.ManageInstances,
        step: Step.SynchronizedInstances,
        instances: INSTANCES,
      },
      trustchain: { trustchain: TRUSTCHAIN, memberCredentials: MEMBER_CREDENTIALS },
    },
  });
}

function OnboardingEntry() {
  const { goToWelcomeScreenWalletSync } = useFlows();
  return (
    <>
      <button onClick={() => goToWelcomeScreenWalletSync(true)}>open</button>
      <WalletSyncActivation sourcePage={AnalyticsPage.Onboarding} />
    </>
  );
}

async function startRemoval() {
  const view = renderInstanceRemoval();
  await view.user.click((await screen.findAllByText("Remove"))[1]);
  await waitFor(() => expect(LedgerSyncDeviceIntentExecutorLWD).toHaveBeenCalled());
  return view;
}

describe("Ledger Sync device steps on DIE", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("activation", () => {
    it.each([
      [TrustchainResultType.created, Step.ActivationFinal, true],
      [TrustchainResultType.restored, Step.SynchronizationFinal, false],
    ])(
      "should store the trustchain and go to the final step after a %s trustchain",
      (type, nextStep, hasTrustchainBeenCreated) => {
        const { store } = renderActivation();

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
        });
      },
    );

    it.each([
      ["already-secured-same-seed", Step.AlreadySecuredSameSeed],
      ["already-secured-other-seed", Step.AlreadySecuredOtherSeed],
      ["no-trustchain", Step.UnbackedError],
    ] as const)("should route the %s failure to its step", (reason, step) => {
      const { store } = renderActivation();

      emit(failed(reason));

      expect(store.getState().walletSync).toMatchObject({ flow: Flow.Synchronize, step });
    });

    it.each(["unknown", "not-allowed"] as const)(
      "should show the %s failure and start a new run on retry",
      async reason => {
        const { store, user } = renderActivation();
        const firstIntent = lastIntent();

        emit(failed(reason));

        expect(store.getState().walletSync.step).toBe(Step.DeviceAction);
        await user.click(await screen.findByRole("button", { name: /retry/i }));

        await waitFor(() => expect(lastIntent().uuid).not.toBe(firstIntent.uuid));
        expect(lastIntent().label).toBe(addMemberIntentLWDDefinition.label);
      },
    );

    it("should keep the run open after a device rejection and finish it after the retry", () => {
      const { store } = renderActivation();
      const intent = lastIntent();

      emit({ type: "device-rejected", error: new Error("UserRefusedOnDevice"), retry: jest.fn() });
      expect(store.getState().walletSync.step).toBe(Step.DeviceAction);

      emit({ type: "pending" });
      deliver({ type: TrustchainResultType.created, trustchain: TRUSTCHAIN });
      emit({ type: "completed" });

      expect(new Set(mountedIntents().map(({ uuid }) => uuid))).toEqual(new Set([intent.uuid]));
      expect(store.getState().walletSync.step).toBe(Step.ActivationLoading);
    });

    it("should go back to the first step when the user leaves the executor", () => {
      const { store } = renderActivation();

      act(() => lastMountedProps().onUserCancel());

      expect(store.getState().walletSync.step).toBe(Step.CreateOrSynchronize);
    });

    it("should restore the known trustchain instead of creating one", () => {
      render(<WalletSyncActivation sourcePage={AnalyticsPage.LedgerSyncSettings} />, {
        initialState: {
          ...dieFlagOn,
          walletSync: { ...initialStateWalletSync, step: Step.DeviceAction },
          trustchain: { trustchain: TRUSTCHAIN, memberCredentials: MEMBER_CREDENTIALS },
        },
      });

      expect(lastIntent().input).toMatchObject({ currentTrustchain: TRUSTCHAIN });
    });
  });

  describe("onboarding", () => {
    it("should reach the DIE step from a new device onboarding and close the drawer once done", async () => {
      const { store, user } = render(<OnboardingEntry />, {
        initialState: {
          ...dieFlagOn,
          walletSync: { ...initialStateWalletSync, isDrawerOpen: true },
          trustchain: { trustchain: null, memberCredentials: MEMBER_CREDENTIALS },
        },
      });

      await user.click(screen.getByRole("button", { name: "open" }));

      expect(store.getState().walletSync).toMatchObject({
        step: Step.DeviceAction,
        onboardingNewDevice: true,
      });
      expect(lastIntent().label).toBe(addMemberIntentLWDDefinition.label);

      deliver({ type: TrustchainResultType.created, trustchain: TRUSTCHAIN });
      emit({ type: "completed" });

      expect(store.getState().trustchain.trustchain).toEqual(TRUSTCHAIN);
      expect(store.getState().walletSync.isDrawerOpen).toBe(false);
      expect(store.getState().settings.hasCompletedOnboarding).toBe(false);
    });

    it("should complete the onboarding with the connected device outside a new device onboarding", () => {
      const { store } = renderActivation(AnalyticsPage.Onboarding, { isDrawerOpen: true });

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
    it("should store the rotated trustchain and show the deletion success", async () => {
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
    });

    it("should route a not-allowed failure to the unsecured ledger step", async () => {
      const { store } = await startRemoval();

      emit(failed("not-allowed"));

      expect(store.getState().walletSync.step).toBe(Step.UnsecuredLedger);
    });

    it("should show any other failure and start a new run on retry", async () => {
      const { store, user } = await startRemoval();
      const firstIntent = lastIntent();

      emit(failed("unknown"));

      expect(store.getState().walletSync.step).toBe(Step.DeviceActionInstance);
      await user.click(await screen.findByRole("button", { name: /retry/i }));

      await waitFor(() => expect(lastIntent().uuid).not.toBe(firstIntent.uuid));
      expect(lastIntent().label).toBe(removeMemberIntentLWDDefinition.label);
    });

    it("should go back to the instance list when the user leaves the executor", async () => {
      const { store } = await startRemoval();

      act(() => lastMountedProps().onUserCancel());

      expect(store.getState().walletSync.step).toBe(Step.SynchronizedInstances);
    });
  });
});
