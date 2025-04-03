import React, { Component, useEffect } from "react";
import BigNumber from "bignumber.js";
import { Trans, useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { Action } from "@ledgerhq/live-common/hw/actions/types";
import {
  EConnResetError,
  ImageDoesNotExistOnDevice,
  LanguageInstallRefusedOnDevice,
  LatestFirmwareVersionRequired,
  NoSuchAppOnProvider,
  OutdatedApp,
} from "@ledgerhq/live-common/errors";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import {
  addNewDeviceModel,
  setLastSeenDeviceInfo,
  setPreferredDeviceModel,
} from "~/renderer/actions/settings";
import {
  preferredDeviceModelSelector,
  storeSelector as settingsSelector,
  trackingEnabledSelector,
} from "~/renderer/reducers/settings";
import { DeviceModelId } from "@ledgerhq/devices";
import AutoRepair from "~/renderer/components/AutoRepair";
import TransactionConfirm from "~/renderer/components/TransactionConfirm";
import SignMessageConfirm from "~/renderer/components/SignMessageConfirm";
import useTheme from "~/renderer/hooks/useTheme";
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
import {
  Account,
  AccountLike,
  AnyMessage,
  DeviceInfo,
  DeviceModelInfo,
} from "@ledgerhq/types-live";
import {
  ExchangeRate,
  ExchangeSwap,
  InitSwapResult,
} from "@ledgerhq/live-common/exchange/swap/types";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { AppAndVersion } from "@ledgerhq/live-common/hw/connectApp";
import { Device } from "@ledgerhq/types-devices";
import { LedgerErrorConstructor } from "@ledgerhq/errors/lib/helpers";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getNoSuchAppProviderLearnMoreMetadataPerApp, isDeviceNotOnboardedError } from "./utils";
import { useKeepScreenAwake } from "~/renderer/hooks/useKeepScreenAwake";
import { walletSelector } from "~/renderer/reducers/wallet";
import { useTrackManagerSectionEvents } from "~/renderer/analytics/hooks/useTrackManagerSectionEvents";
import { useTrackReceiveFlow } from "~/renderer/analytics/hooks/useTrackReceiveFlow";
import { useTrackAddAccountModal } from "~/renderer/analytics/hooks/useTrackAddAccountModal";
import { useTrackExchangeFlow } from "~/renderer/analytics/hooks/useTrackExchangeFlow";
import { useTrackSendFlow } from "~/renderer/analytics/hooks/useTrackSendFlow";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";
import { useTrackSyncFlow } from "~/renderer/analytics/hooks/useTrackSyncFlow";
import { useTrackGenericDAppTransactionSend } from "~/renderer/analytics/hooks/useTrackGenericDAppTransactionSend";
import { useTrackTransactionChecksFlow } from "~/renderer/analytics/hooks/useTrackTransactionChecksFlow";

export type LedgerError = InstanceType<LedgerErrorConstructor<{ [key: string]: unknown }>>;

type PartialNullable<T> = {
  [P in keyof T]?: T[P] | null;
};

type States = PartialNullable<{
  appAndVersion: AppAndVersion;
  device: Device;
  unresponsive: boolean;
  isLocked: boolean;
  error: LedgerError & {
    name?: string;
    managerAppName?: string;
  };
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
  transactionChecksOptInTriggered: boolean;
}>;

type InnerProps<P> = {
  Result?: React.ComponentType<P>;
  onResult?: (_: NonNullable<P>) => void;
  onError?: (_: Error) => Promise<void> | void;
  renderOnResult?: (_: P) => JSX.Element | null;
  onSelectDeviceLink?: () => void;
  analyticsPropertyFlow?: string;
  overridesPreferredDeviceModel?: DeviceModelId;
  inlineRetry?: boolean; // Set to false if the retry mechanism is handled externally.
  location?: HOOKS_TRACKING_LOCATIONS;
};

type Props<H extends States, P> = InnerProps<P> & {
  status: H;
  payload?: P | null;
};

class OnResult<P> extends Component<{ payload: P; onResult: (_: P) => void }> {
  componentDidMount() {
    const { onResult, payload } = this.props;
    onResult && onResult(payload);
  }

  render() {
    return null;
  }
}

export const DeviceActionDefaultRendering = <R, H extends States, P>({
  status: hookState,
  payload,
  request,
  Result,
  onResult,
  onError,
  overridesPreferredDeviceModel,
  inlineRetry = true,
  analyticsPropertyFlow,
  location,
}: Props<H, P> & {
  request?: R;
}) => {
  const {
    appAndVersion,
    device,
    unresponsive,
    isLocked,
    error,
    isLoading,
    allowManagerRequested,
    allowRenamingRequested,
    imageRemoveRequested,
    requestQuitApp,
    deviceInfo,
    latestFirmware,
    repairModalOpened,
    requestOpenApp,
    allowOpeningRequestedWording,
    installingApp,
    progress,
    listingApps,
    requiresAppInstallation,
    languageInstallationRequested,
    installingLanguage,
    inWrongDeviceForAccount,
    onRetry,
    onAutoRepair,
    closeRepairModal,
    onRepairModal,
    deviceSignatureRequested,
    deviceStreamingProgress,
    transactionChecksOptInTriggered,
    displayUpgradeWarning,
    passWarning,
    initSwapRequested,
    initSwapError,
    initSwapResult,
    completeExchangeStarted,
    completeExchangeResult,
    completeExchangeError,
    allowOpeningGranted,
    signMessageRequested,
    manifestId,
    manifestName,
  } = hookState;

  const dispatch = useDispatch();
  const preferredDeviceModel = useSelector(preferredDeviceModelSelector);
  const swapDefaultTrack = useGetSwapTrackingProperties();
  const stateSettings = useSelector(settingsSelector);
  const walletState = useSelector(walletSelector);

  useTrackManagerSectionEvents({
    location: location === HOOKS_TRACKING_LOCATIONS.managerDashboard ? location : undefined,
    device,
    allowManagerRequested: hookState.allowManagerRequested,
    clsImageRemoved: hookState.imageRemoved,
    error,
    isTrackingEnabled: useSelector(trackingEnabledSelector),
  });

  useTrackReceiveFlow({
    location: location === HOOKS_TRACKING_LOCATIONS.receiveModal ? location : undefined,
    device,
    error,
    inWrongDeviceForAccount,
    isLocked,
    isTrackingEnabled: useSelector(trackingEnabledSelector),
  });

  useTrackAddAccountModal({
    location: location === HOOKS_TRACKING_LOCATIONS.addAccountModal ? location : undefined,
    device,
    error,
    isTrackingEnabled: useSelector(trackingEnabledSelector),
    requestOpenApp,
    userMustConnectDevice: !isLoading && !device,
    isLocked,
  });

  useTrackExchangeFlow({
    location: location === HOOKS_TRACKING_LOCATIONS.exchange ? location : undefined,
    device,
    error,
    isTrackingEnabled: useSelector(trackingEnabledSelector),
    isLocked,
    inWrongDeviceForAccount,
    isRequestOpenAppExchange: requestOpenApp === "Exchange",
  });

  useTrackSyncFlow({
    location: location === HOOKS_TRACKING_LOCATIONS.ledgerSync ? location : undefined,
    device,
    error,
    allowManagerRequested: hookState.allowManagerRequested,
    requestOpenApp,
    isLedgerSyncAppOpen: appAndVersion?.name === "Ledger Sync",
    isLocked,
    isTrackingEnabled: useSelector(trackingEnabledSelector),
    inWrongDeviceForAccount,
  });

  useTrackSendFlow({
    location: location === HOOKS_TRACKING_LOCATIONS.sendModal ? location : undefined,
    device,
    error,
    inWrongDeviceForAccount,
    isLocked,
    isTrackingEnabled: useSelector(trackingEnabledSelector),
  });

  useTrackGenericDAppTransactionSend({
    location:
      location === HOOKS_TRACKING_LOCATIONS.genericDAppTransactionSend ? location : undefined,
    device,
    error,
    allowManagerRequested: hookState.allowManagerRequested,
    requestOpenApp,
    openedAppName: appAndVersion?.name,
    isLocked,
    inWrongDeviceForAccount,
    isTrackingEnabled: useSelector(trackingEnabledSelector),
  });

  useTrackTransactionChecksFlow({
    location,
    device,
    deviceInfo,
    appAndVersion,
    transactionChecksOptInTriggered,
    isTrackingEnabled: useSelector(trackingEnabledSelector),
  });

  const type = useTheme().colors.palette.type;

  const modelId = device ? device.modelId : overridesPreferredDeviceModel || preferredDeviceModel;

  useEffect(() => {
    if (modelId !== preferredDeviceModel) {
      dispatch(setPreferredDeviceModel(modelId));
    }
  }, [dispatch, modelId, preferredDeviceModel]);

  const { t } = useTranslation();

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  useEffect(() => {
    if (deviceInfo && device) {
      const lastSeenDevice: DeviceModelInfo = {
        modelId: device.modelId,
        deviceInfo,
        apps: [],
      };
      dispatch(setLastSeenDeviceInfo({ lastSeenDevice, latestFirmware }));
      dispatch(addNewDeviceModel({ deviceModelId: lastSeenDevice.modelId }));
    }
  }, [dispatch, device, deviceInfo, latestFirmware]);

  if (displayUpgradeWarning && appAndVersion && passWarning) {
    return renderWarningOutdated({ appName: appAndVersion.name, passWarning });
  }

  if (repairModalOpened && repairModalOpened.auto && closeRepairModal) {
    return <AutoRepair onDone={closeRepairModal} />;
  }

  if (requestQuitApp) {
    return renderRequestQuitApp({ modelId, type });
  }

  if (installingApp && requestOpenApp && request) {
    const appName = requestOpenApp;
    return (
      <InstallingApp
        type={type}
        modelId={modelId}
        appName={appName}
        progress={progress ?? 0}
        request={request}
        analyticsPropertyFlow={analyticsPropertyFlow}
      />
    );
  }

  if (installingLanguage) {
    return renderInstallingLanguage({ progress: progress ?? 0, t });
  }

  if (requiresAppInstallation) {
    const { appName, appNames: maybeAppNames } = requiresAppInstallation;
    const appNames = maybeAppNames?.length ? maybeAppNames : [appName];

    return renderRequiresAppInstallation({ appNames });
  }

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
    const refused = error instanceof UserRefusedOnDevice;
    const noImage = error instanceof ImageDoesNotExistOnDevice;
    if (error) {
      if (refused || noImage) {
        return renderError({
          t,
          inlineRetry,
          error,
          onRetry: refused ? onRetry : undefined,
          info: true,
        });
      }
    } else {
      return renderAllowRemoveCustomLockscreen({ modelId, type });
    }
  }

  if (listingApps) {
    return renderListingApps();
  }

  if (completeExchangeStarted && !completeExchangeResult && !completeExchangeError && !isLoading) {
    const { exchangeType } = request as { exchangeType: number };

    // FIXME: could use a TS enum (when LLD will be in TS) or a JS object instead of raw numbers for switch values for clarity
    switch (exchangeType) {
      // swap
      case 0x00: {
        const {
          transaction,
          exchange,
          provider,
          rate = 1,
          amountExpectedTo = 0,
        } = request as {
          transaction: Transaction;
          exchange: ExchangeSwap;
          provider: string;
          rate: number;
          amountExpectedTo: number;
        };
        const { estimatedFees } = hookState;

        return renderSwapDeviceConfirmation({
          modelId: device.modelId,
          type,
          transaction,
          exchangeRate: {
            provider,
            rate: new BigNumber(rate),
          } as ExchangeRate,
          exchange,
          swapDefaultTrack,
          amountExpectedTo: amountExpectedTo.toString() ?? undefined,
          estimatedFees: estimatedFees?.toString() ?? undefined,
          stateSettings,
          walletState,
        });
      }

      case 0x01: // sell
      case 0x02: // fund
        return renderSecureTransferDeviceConfirmation({
          exchangeType: exchangeType === 0x01 ? "sell" : "fund",
          modelId,
          type,
        });

      default:
        return <div>{"Confirm exchange on your device"}</div>;
    }
  }

  if (initSwapRequested && !initSwapResult && !initSwapError) {
    const { transaction, exchange, exchangeRate } = request as {
      transaction: Transaction;
      exchange: ExchangeSwap;
      exchangeRate: ExchangeRate;
    };
    const { amountExpectedTo, estimatedFees } = hookState;
    return renderSwapDeviceConfirmation({
      modelId,
      type,
      transaction,
      exchangeRate,
      exchange,
      amountExpectedTo: amountExpectedTo ?? undefined,
      estimatedFees: estimatedFees ?? undefined,
      swapDefaultTrack,
      stateSettings,
      walletState,
    });
  }

  if (allowOpeningRequestedWording || requestOpenApp) {
    // requestOpenApp for Nano S 1.3.1 (need to ask user to open the app.)
    const wording = allowOpeningRequestedWording || requestOpenApp || "";
    const { tokenCurrency } = request as { tokenCurrency: TokenCurrency };
    const tokenContext = tokenCurrency;
    return renderAllowOpeningApp({
      modelId,
      type,
      wording,
      tokenContext,
      isDeviceBlocker: !requestOpenApp,
    });
  }

  if (inWrongDeviceForAccount) {
    return renderInWrongAppForAccount({ t, onRetry });
  }

  if (unresponsive || error instanceof TransportRaceCondition) {
    return renderError({
      t,
      error: new UnresponsiveDeviceError(),
      onRetry,
      withExportLogs: false,
    });
  }

  if (!isLoading && error) {
    const e = error as unknown;
    if (
      e instanceof ManagerNotEnoughSpaceError ||
      e instanceof OutdatedApp ||
      e instanceof UpdateYourApp
    ) {
      return renderError({
        t,
        error,
        managerAppName: (error as { managerAppName: string }).managerAppName,
      });
    }

    if (e instanceof LatestFirmwareVersionRequired) {
      return renderError({
        t,
        error,
        requireFirmwareUpdate: true,
      });
    }

    // NB Until we find a better way, remap the error if it's 6d06 (LNS, LNSP, LNX) or 6d07 (Stax) and we haven't fallen
    // into another handled case.
    if (isDeviceNotOnboardedError(e)) {
      return <DeviceNotOnboardedErrorComponent t={t} device={device} />;
    }

    if (e instanceof NoSuchAppOnProvider) {
      return renderError({
        t,
        error,
        withOpenManager: true,
        withExportLogs: true,
        ...(device && { device }),
        ...getNoSuchAppProviderLearnMoreMetadataPerApp((request as { appName: string })?.appName),
      });
    }

    // workaround to catch ECONNRESET error and show better message
    if ((error as Error)?.message?.includes("ECONNRESET")) {
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

  // Renders an error as long as LLD is using the "event" implementation of device actions
  if (isLocked) {
    return renderLockedDeviceError({ t, device, onRetry, inlineRetry });
  }

  if (!isLoading && !device) {
    return renderConnectYourDevice({
      modelId,
      type,
      unresponsive,
      device,
      onRepairModal,
    });
  }

  if (isLoading || (allowOpeningGranted && !appAndVersion)) {
    return renderLoading();
  }

  if (deviceInfo && deviceInfo.isBootloader && onAutoRepair) {
    return renderBootloaderStep({ onAutoRepair });
  }

  if (request && device && deviceSignatureRequested) {
    const { account, parentAccount, status, transaction } = request as unknown as {
      account: AccountLike;
      parentAccount: Account | null;
      status: TransactionStatus;
      transaction: Transaction;
    };
    if (account && status && transaction) {
      return (
        <TransactionConfirm
          device={device}
          account={account}
          parentAccount={parentAccount}
          transaction={transaction}
          status={status}
          manifestId={manifestId}
          manifestName={manifestName}
        />
      );
    }
  }

  if (request && signMessageRequested) {
    const { account, parentAccount } = request as unknown as {
      account: AccountLike;
      parentAccount: Account | null;
    };
    return (
      <SignMessageConfirm
        device={device}
        account={account}
        parentAccount={parentAccount}
        signMessageRequested={signMessageRequested}
      />
    );
  }

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

  if (!payload) {
    return null;
  }

  return (
    <>
      {Result ? <Result {...payload} /> : null}
      {onResult ? <OnResult onResult={onResult} payload={payload} /> : null}
    </>
  );
};

/**
 * Perform an action involving a device.
 * @prop action: one of the actions/*
 * @prop request: an object that is the input of that action
 * @prop Result optional: an action produces a result, this gives a component to render it
 * @prop onResult optional: an action produces a result, this gives a callback to be called with it
 * @prop location optional: an action might need to know the location for analytics
 */

export default function DeviceAction<R, H extends States, P>({
  action,
  request,
  location,
  ...props
}: InnerProps<P> & {
  action: Action<R, H, P>;
  request: R;
}): JSX.Element {
  const device = useSelector(getCurrentDevice);
  const hookState = action.useHook(device, request);
  const payload = action.mapResult(hookState);
  useKeepScreenAwake(true);

  return (
    <DeviceActionDefaultRendering
      status={hookState}
      request={request}
      payload={payload}
      location={location}
      {...props}
    />
  );
}
