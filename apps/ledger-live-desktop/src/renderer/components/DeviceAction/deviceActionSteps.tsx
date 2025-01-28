import React, { Component } from "react";
import BigNumber from "bignumber.js";
import { Trans } from "react-i18next";
import {
  EConnResetError,
  ImageDoesNotExistOnDevice,
  LanguageInstallRefusedOnDevice,
  LatestFirmwareVersionRequired,
  NoSuchAppOnProvider,
  OutdatedApp,
} from "@ledgerhq/live-common/errors";
import { storeSelector as settingsSelector } from "~/renderer/reducers/settings";
import { DeviceModelId } from "@ledgerhq/devices";
import AutoRepair from "~/renderer/components/AutoRepair";
import TransactionConfirm from "~/renderer/components/TransactionConfirm";
import SignMessageConfirm from "~/renderer/components/SignMessageConfirm";
import {
  DeviceNotOnboardedErrorComponent,
  InstallingApp,
  renderAllowLanguageInstallation,
  renderAllowManager,
  renderAllowOpeningApp,
  renderAllowRemoveCustomLockscreen,
  renderBootloaderStep,
  renderConnectYourDevice,
  renderError,
  renderInstallingLanguage,
  renderInWrongAppForAccount,
  renderListingApps,
  renderLoading,
  renderLockedDeviceError,
  renderRequestQuitApp,
  renderRequiresAppInstallation,
  renderSecureTransferDeviceConfirmation,
  renderSwapDeviceConfirmation,
  renderWarningOutdated,
} from "./rendering";
import { useGetSwapTrackingProperties } from "~/renderer/screens/exchange/Swap2/utils";
import { Account, AccountLike, AnyMessage, DeviceInfo } from "@ledgerhq/types-live";
import {
  ExchangeRate,
  ExchangeSwap,
  InitSwapResult,
} from "@ledgerhq/live-common/exchange/swap/types";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { AppAndVersion } from "@ledgerhq/live-common/hw/connectApp";
import { Device } from "@ledgerhq/types-devices";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getNoSuchAppProviderLearnMoreMetadataPerApp, isDeviceNotOnboardedError } from "./utils";
import { walletSelector } from "~/renderer/reducers/wallet";
import { TFunction as I18nTFunction } from "i18next";
import {
  ManagerNotEnoughSpaceError,
  TransportRaceCondition,
  UnresponsiveDeviceError,
  UpdateYourApp,
  UserRefusedAddress,
  UserRefusedAllowManager,
  UserRefusedDeviceNameChange,
  UserRefusedFirmwareUpdate,
  UserRefusedOnDevice,
} from "@ledgerhq/errors";

class OnResult<P> extends Component<{ payload: P; onResult: (_: P) => void }> {
  componentDidMount() {
    const { onResult, payload } = this.props;
    onResult && onResult(payload);
  }

  render() {
    return null;
  }
}

export type LedgerError = Error;

export type PartialNullable<T> = {
  [P in keyof T]?: T[P] | null;
};

export type States = PartialNullable<{
  appAndVersion: AppAndVersion;
  device: Device;
  unresponsive: boolean;
  isLocked: boolean;
  error: LedgerError;
  isLoading: boolean;
  allowManagerRequested: boolean;
  allowRenamingRequested: boolean;
  requestQuitApp: boolean;
  deviceInfo: DeviceInfo;
  latestFirmware: unknown;
  onRepairModal: (open: boolean) => void;
  requestOpenApp: string;
  allowOpeningRequestedWording: string;
  requiresAppInstallation: {
    appName: string;
    appNames: string[];
  };
  inWrongDeviceForAccount: {
    accountName: string;
  };
  onRetry: () => void;
  repairModalOpened: {
    auto: boolean;
  };
  onAutoRepair: () => void;
  closeRepairModal: () => void;
  deviceSignatureRequested: boolean;
  deviceStreamingProgress: number;
  displayUpgradeWarning: boolean;
  passWarning: () => void;
  initSwapRequested: boolean;
  initSwapError: Error;
  initSwapResult: InitSwapResult | null;
  installingLanguage: boolean;
  languageInstallationRequested: boolean;
  signMessageRequested: AnyMessage;
  allowOpeningGranted: boolean;
  completeExchangeStarted: boolean;
  completeExchangeResult: Transaction;
  completeExchangeError: Error;
  imageRemoveRequested: boolean;
  imageRemoved: boolean;
  installingApp: boolean;
  progress: number;
  listingApps: boolean;
  amountExpectedTo: string;
  estimatedFees: string;
  imageLoadRequested: boolean;
  loadingImage: boolean;
  imageLoaded: boolean;
  imageCommitRequested: boolean;
  manifestName: string;
  manifestId: string;
}>;

export type InnerProps<P> = {
  Result?: React.ComponentType<P>;
  onResult?: (_: NonNullable<P>) => void;
  onError?: (_: Error) => Promise<void> | void;
  renderOnResult?: (_: P) => JSX.Element | null;
  onSelectDeviceLink?: () => void;
  analyticsPropertyFlow?: string;
  overridesPreferredDeviceModel?: DeviceModelId;
  inlineRetry?: boolean; // Set to false if the retry mechanism is handled externally.
  location?: string;
};

export type Props<H extends States, P> = InnerProps<P> & {
  status: H;
  payload?: P | null;
  request?: unknown;
};

export type RenderContext<H extends States, P> = {
  hookState: H;
  payload: P | null | undefined;
  request: unknown;
  inlineRetry: boolean;
  modelId: DeviceModelId;
  type: "dark" | "light";
  swapDefaultTrack: ReturnType<typeof useGetSwapTrackingProperties>;
  stateSettings: ReturnType<typeof settingsSelector>;
  walletState: ReturnType<typeof walletSelector>;
  t: I18nTFunction;
  analyticsPropertyFlow?: string;
};

export type ExtendedRenderContext<H extends States, P> = RenderContext<H, P> & {
  manifestId?: string | null;
  manifestName?: string | null;
};

export function stepWarningOutdated<H extends States, P>(ctx: ExtendedRenderContext<H, P>) {
  const { displayUpgradeWarning, appAndVersion, passWarning } = ctx.hookState;
  if (displayUpgradeWarning && appAndVersion && passWarning) {
    return renderWarningOutdated({ appName: appAndVersion.name, passWarning });
  }
  return null;
}

export function stepAutoRepair<H extends States, P>(ctx: ExtendedRenderContext<H, P>) {
  const { repairModalOpened, closeRepairModal } = ctx.hookState;
  if (repairModalOpened && repairModalOpened.auto && closeRepairModal) {
    return <AutoRepair onDone={closeRepairModal} />;
  }
  return null;
}

export function stepRequestQuitApp<H extends States, P>(ctx: ExtendedRenderContext<H, P>) {
  const { requestQuitApp } = ctx.hookState;
  if (requestQuitApp) {
    return renderRequestQuitApp({ modelId: ctx.modelId, type: ctx.type });
  }
  return null;
}

export function stepInstallingApp<H extends States, P>(ctx: ExtendedRenderContext<H, P>) {
  const { installingApp, requestOpenApp, progress } = ctx.hookState;
  if (installingApp && requestOpenApp && ctx.request) {
    const appName = requestOpenApp;
    return (
      <InstallingApp
        type={ctx.type}
        modelId={ctx.modelId}
        appName={appName}
        progress={progress ?? 0}
        request={ctx.request}
        analyticsPropertyFlow={ctx.analyticsPropertyFlow}
      />
    );
  }
  return null;
}

export function stepInstallingLanguage<H extends States, P>(ctx: ExtendedRenderContext<H, P>) {
  const { installingLanguage, progress } = ctx.hookState;
  if (installingLanguage) {
    return renderInstallingLanguage({ progress: progress ?? 0, t: ctx.t });
  }
  return null;
}

export function stepRequiresAppInstallation<H extends States, P>(ctx: ExtendedRenderContext<H, P>) {
  const { requiresAppInstallation } = ctx.hookState;
  if (requiresAppInstallation) {
    const { appName, appNames: maybeAppNames } = requiresAppInstallation;
    const appNames = maybeAppNames?.length ? maybeAppNames : [appName];
    return renderRequiresAppInstallation({ appNames });
  }
  return null;
}

export function stepAllowManagerLanguageLockscreen<H extends States, P>(
  ctx: ExtendedRenderContext<H, P>,
) {
  const {
    allowRenamingRequested,
    allowManagerRequested,
    languageInstallationRequested,
    imageRemoveRequested,
    error,
    onRetry,
  } = ctx.hookState;
  const { inlineRetry, modelId, type, t } = ctx;

  if (allowRenamingRequested) {
    return renderAllowManager({ modelId, type, requestType: "rename" });
  }
  if (allowManagerRequested) {
    return renderAllowManager({ modelId, type });
  }
  if (languageInstallationRequested) {
    return renderAllowLanguageInstallation({ modelId, type, t });
  }
  if (imageRemoveRequested) {
    const e = error;
    if (e) {
      const refused = e instanceof UserRefusedOnDevice;
      const noImage = e instanceof ImageDoesNotExistOnDevice;
      if (refused || noImage) {
        return renderError({
          t,
          inlineRetry,
          error: e,
          onRetry: refused ? onRetry : undefined,
          info: true,
        });
      }
    } else {
      return renderAllowRemoveCustomLockscreen({ modelId, type });
    }
  }
  return null;
}

export function stepListingApps<H extends States, P>(ctx: ExtendedRenderContext<H, P>) {
  if (ctx.hookState.listingApps) {
    return renderListingApps();
  }
  return null;
}

export function stepCompleteExchangeStarted<H extends States, P>(ctx: ExtendedRenderContext<H, P>) {
  const {
    completeExchangeStarted,
    completeExchangeResult,
    completeExchangeError,
    isLoading,
    device,
    estimatedFees,
  } = ctx.hookState;

  if (completeExchangeStarted && !completeExchangeResult && !completeExchangeError && !isLoading) {
    const req = ctx.request as { exchangeType?: number };
    const exchangeType = req?.exchangeType;

    // FIXME: could use a TS enum (when LLD will be in TS) or a JS object instead of raw numbers for switch values for clarity
    switch (exchangeType) {
      // Swap
      case 0x00: {
        const {
          transaction,
          exchange,
          provider,
          rate = 1,
          amountExpectedTo = 0,
        } = (ctx.request as {
          transaction?: Transaction;
          exchange?: ExchangeSwap;
          provider?: string;
          rate?: number;
          amountExpectedTo?: number;
        }) ?? {};
        if (!transaction || !exchange) return null; // fallback
        return renderSwapDeviceConfirmation({
          modelId: device?.modelId ?? ctx.modelId,
          type: ctx.type,
          transaction,
          exchangeRate: {
            provider: provider || "",
            rate: new BigNumber(rate),
          } as ExchangeRate,
          exchange,
          swapDefaultTrack: ctx.swapDefaultTrack,
          amountExpectedTo: amountExpectedTo.toString(),
          estimatedFees: estimatedFees?.toString(),
          stateSettings: ctx.stateSettings,
          walletState: ctx.walletState,
        });
      }
      case 0x01: // sell
      case 0x02: // fund
        return renderSecureTransferDeviceConfirmation({
          exchangeType: exchangeType === 0x01 ? "sell" : "fund",
          modelId: ctx.modelId,
          type: ctx.type,
        });

      default:
        return <div>{"Confirm exchange on your device"}</div>;
    }
  }
  return null;
}

export function stepInitSwapRequested<H extends States, P>(ctx: ExtendedRenderContext<H, P>) {
  const { initSwapRequested, initSwapResult, initSwapError, amountExpectedTo, estimatedFees } =
    ctx.hookState;
  if (initSwapRequested && !initSwapResult && !initSwapError) {
    const { transaction, exchange, exchangeRate } =
      (ctx.request as {
        transaction?: Transaction;
        exchange?: ExchangeSwap;
        exchangeRate?: ExchangeRate;
      }) ?? {};
    if (!transaction || !exchange || !exchangeRate) return null;
    return renderSwapDeviceConfirmation({
      modelId: ctx.modelId,
      type: ctx.type,
      transaction,
      exchangeRate,
      exchange,
      amountExpectedTo: amountExpectedTo ?? undefined,
      estimatedFees: estimatedFees ?? undefined,
      swapDefaultTrack: ctx.swapDefaultTrack,
      stateSettings: ctx.stateSettings,
      walletState: ctx.walletState,
    });
  }
  return null;
}

export function stepAllowOpeningApp<H extends States, P>(ctx: ExtendedRenderContext<H, P>) {
  const { allowOpeningRequestedWording, requestOpenApp } = ctx.hookState;
  if (allowOpeningRequestedWording || requestOpenApp) {
    // requestOpenApp for Nano S 1.3.1 (need to ask user to open the app.)
    const wording = allowOpeningRequestedWording || requestOpenApp || "";
    const { tokenCurrency } = (ctx.request as { tokenCurrency?: TokenCurrency }) ?? {};
    return renderAllowOpeningApp({
      modelId: ctx.modelId,
      type: ctx.type,
      wording,
      tokenContext: tokenCurrency,
      isDeviceBlocker: !requestOpenApp,
    });
  }
  return null;
}

export function stepInWrongAppForAccount<H extends States, P>(ctx: ExtendedRenderContext<H, P>) {
  const { inWrongDeviceForAccount, onRetry } = ctx.hookState;
  if (inWrongDeviceForAccount) {
    return renderInWrongAppForAccount({ t: ctx.t, onRetry });
  }
  return null;
}

export function stepUnresponsiveOrTransportError<H extends States, P>(
  ctx: ExtendedRenderContext<H, P>,
) {
  const { unresponsive, error, onRetry } = ctx.hookState;
  if (unresponsive || (error as unknown) instanceof TransportRaceCondition) {
    return renderError({
      t: ctx.t,
      error: new UnresponsiveDeviceError(),
      onRetry,
      withExportLogs: false,
    });
  }
  return null;
}

export function stepErrorHandling<H extends States, P>(ctx: ExtendedRenderContext<H, P>) {
  const { error, onRetry, device } = ctx.hookState;
  const { inlineRetry, t, request } = ctx;
  if (!error) return null;

  if (
    (error as unknown) instanceof ManagerNotEnoughSpaceError ||
    (error as unknown) instanceof OutdatedApp ||
    (error as unknown) instanceof UpdateYourApp
  ) {
    return renderError({
      t,
      error,
      managerAppName: (error as unknown as { managerAppName: string }).managerAppName,
    });
  }

  if ((error as unknown) instanceof LatestFirmwareVersionRequired) {
    return renderError({
      t,
      error,
      requireFirmwareUpdate: true,
    });
  }

  // NB Until we find a better way, remap the error if it's 6d06 (LNS, LNSP, LNX) or 6d07 (Stax) and we haven't fallen
  // into another handled case.
  if (isDeviceNotOnboardedError(error)) {
    return <DeviceNotOnboardedErrorComponent t={t} device={device ?? null} />;
  }

  if ((error as unknown) instanceof NoSuchAppOnProvider) {
    return renderError({
      t,
      error,
      withOpenManager: true,
      withExportLogs: true,
      device: device ?? undefined,
      ...getNoSuchAppProviderLearnMoreMetadataPerApp((request as { appName: string })?.appName),
    });
  }

  // workaround to catch ECONNRESET error and show better message
  if ((error as Error).message?.includes("ECONNRESET")) {
    return renderError({
      t,
      error: new EConnResetError(),
      onRetry,
      withExportLogs: true,
    });
  }

  let withExportLogs = true;
  let warning = false;
  let withDescription = true;
  // User rejections, should be rendered as warnings and not export logs.
  // All the error rendering needs to be unified, the same way we do for ErrorIcon
  // not handled here.
  if (
    (error as unknown) instanceof UserRefusedFirmwareUpdate ||
    (error as unknown) instanceof UserRefusedAllowManager ||
    (error as unknown) instanceof UserRefusedOnDevice ||
    (error as unknown) instanceof UserRefusedAddress ||
    (error as unknown) instanceof UserRefusedDeviceNameChange ||
    (error as unknown) instanceof LanguageInstallRefusedOnDevice
  ) {
    withExportLogs = false;
    warning = true;
  }

  if ((error as unknown) instanceof UserRefusedDeviceNameChange) {
    withDescription = false;
  }

  return renderError({
    t,
    error,
    warning,
    onRetry,
    withExportLogs,
    device: device ?? undefined,
    inlineRetry,
    withDescription,
  });
}

export function stepLockedDevice<H extends States, P>(ctx: ExtendedRenderContext<H, P>) {
  const { isLocked, device, onRetry } = ctx.hookState;
  if (isLocked) {
    return renderLockedDeviceError({
      t: ctx.t,
      device: device ?? null,
      onRetry,
      inlineRetry: ctx.inlineRetry,
    });
  }
  return null;
}

export function stepConnectDevice<H extends States, P>(ctx: ExtendedRenderContext<H, P>) {
  const { isLoading, device, unresponsive, onRepairModal } = ctx.hookState;
  if (!isLoading && !device) {
    return renderConnectYourDevice({
      modelId: ctx.modelId,
      type: ctx.type,
      unresponsive: unresponsive ?? false,
      device: device ?? undefined,
      onRepairModal,
    });
  }
  return null;
}

export function stepLoading<H extends States, P>(ctx: ExtendedRenderContext<H, P>) {
  const { isLoading, allowOpeningGranted, appAndVersion } = ctx.hookState;
  if (isLoading || (allowOpeningGranted && !appAndVersion)) {
    return renderLoading();
  }
  return null;
}

export function stepBootloader<H extends States, P>(ctx: ExtendedRenderContext<H, P>) {
  const { deviceInfo, onAutoRepair } = ctx.hookState;
  if (deviceInfo?.isBootloader && onAutoRepair) {
    return renderBootloaderStep({ onAutoRepair });
  }
  return null;
}

export function stepDeviceSignature<H extends States, P>(ctx: ExtendedRenderContext<H, P>) {
  const { deviceSignatureRequested, device, manifestId, manifestName } = ctx.hookState;
  if (ctx.request && device && deviceSignatureRequested) {
    const { account, parentAccount, status, transaction } =
      (ctx.request as {
        account?: AccountLike;
        parentAccount?: Account | null;
        status?: TransactionStatus;
        transaction?: Transaction;
      }) ?? {};
    if (account && status && transaction) {
      return (
        <TransactionConfirm
          device={device}
          account={account}
          parentAccount={parentAccount ?? null}
          transaction={transaction}
          status={status}
          manifestId={manifestId ?? undefined}
          manifestName={manifestName ?? undefined}
        />
      );
    }
  }
  return null;
}

export function stepSignMessage<H extends States, P>(ctx: ExtendedRenderContext<H, P>) {
  const { signMessageRequested, device } = ctx.hookState;
  if (ctx.request && signMessageRequested && device) {
    const { account, parentAccount } =
      (ctx.request as {
        account?: AccountLike;
        parentAccount?: Account | null;
      }) ?? {};
    if (!account) return null; // must have an account to sign
    return (
      <SignMessageConfirm
        device={device}
        account={account}
        parentAccount={parentAccount ?? null}
        signMessageRequested={signMessageRequested}
      />
    );
  }
  return null;
}

export function stepDeviceStreaming<H extends States, P>(ctx: ExtendedRenderContext<H, P>) {
  const { deviceStreamingProgress } = ctx.hookState;
  if (typeof deviceStreamingProgress === "number") {
    return renderLoading({
      children:
        deviceStreamingProgress > 0 ? (
          // with streaming event, we have accurate version of the wording
          <Trans
            i18nKey="send.steps.verification.streaming.accurate"
            values={{ percentage: (deviceStreamingProgress * 100).toFixed(0) + "%" }}
          />
        ) : (
          // otherwise, we're not accurate (usually because we don't need to, it's fast case)
          <Trans i18nKey="send.steps.verification.streaming.inaccurate" />
        ),
    });
  }
  return null;
}

export function stepFinalPayload<H extends States, P>(ctx: ExtendedRenderContext<H, P>) {
  const { payload } = ctx;
  const { Result, onResult } = ctx as unknown as Props<H, P>;
  if (!payload) return null;
  return (
    <>
      {Result ? <Result {...payload} /> : null}
      {onResult ? <OnResult onResult={onResult} payload={payload} /> : null}
    </>
  );
}
