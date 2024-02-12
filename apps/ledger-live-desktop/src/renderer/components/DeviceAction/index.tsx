import React, { useEffect, Component } from "react";
import BigNumber from "bignumber.js";
import { Trans, useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { Action } from "@ledgerhq/live-common/hw/actions/types";
import {
  OutdatedApp,
  LatestFirmwareVersionRequired,
  NoSuchAppOnProvider,
  EConnResetError,
  LanguageInstallRefusedOnDevice,
  ImageDoesNotExistOnDevice,
} from "@ledgerhq/live-common/errors";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import {
  setPreferredDeviceModel,
  setLastSeenDeviceInfo,
  addNewDeviceModel,
} from "~/renderer/actions/settings";
import { preferredDeviceModelSelector } from "~/renderer/reducers/settings";
import { DeviceModelId } from "@ledgerhq/devices";
import AutoRepair from "~/renderer/components/AutoRepair";
import TransactionConfirm from "~/renderer/components/TransactionConfirm";
import SignMessageConfirm from "~/renderer/components/SignMessageConfirm";
import useTheme from "~/renderer/hooks/useTheme";
import {
  ManagerNotEnoughSpaceError,
  UpdateYourApp,
  UserRefusedAddress,
  UserRefusedAllowManager,
  UserRefusedFirmwareUpdate,
  UserRefusedOnDevice,
  UserRefusedDeviceNameChange,
} from "@ledgerhq/errors";
import {
  InstallingApp,
  renderAllowManager,
  renderAllowOpeningApp,
  renderBootloaderStep,
  renderConnectYourDevice,
  renderError,
  renderInWrongAppForAccount,
  renderLoading,
  renderRequestQuitApp,
  renderRequiresAppInstallation,
  renderListingApps,
  renderWarningOutdated,
  renderSwapDeviceConfirmation,
  renderSecureTransferDeviceConfirmation,
  renderAllowLanguageInstallation,
  renderInstallingLanguage,
  renderAllowRemoveCustomLockscreen,
  renderLockedDeviceError,
  DeviceNotOnboardedErrorComponent,
} from "./rendering";
import { useGetSwapTrackingProperties } from "~/renderer/screens/exchange/Swap2/utils";
import {
  Account,
  AccountLike,
  AnyMessage,
  DeviceInfo,
  DeviceModelInfo,
} from "@ledgerhq/types-live";
import { Exchange, ExchangeRate, InitSwapResult } from "@ledgerhq/live-common/exchange/swap/types";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { AppAndVersion } from "@ledgerhq/live-common/hw/connectApp";
import { Device } from "@ledgerhq/types-devices";
import { LedgerErrorConstructor } from "@ledgerhq/errors/lib/helpers";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { isDeviceNotOnboardedError } from "./utils";

type LedgerError = InstanceType<LedgerErrorConstructor<{ [key: string]: unknown }>>;

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
  installingApp: boolean;
  progress: number;
  listingApps: boolean;
  amountExpectedTo: string;
  estimatedFees: string;
  imageLoadRequested: boolean;
  loadingImage: boolean;
  imageLoaded: boolean;
  imageCommitRequested: boolean;
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
  } = hookState;

  const dispatch = useDispatch();
  const preferredDeviceModel = useSelector(preferredDeviceModelSelector);
  const swapDefaultTrack = useGetSwapTrackingProperties();

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
          exchange: Exchange;
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
      exchange: Exchange;
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
    return renderInWrongAppForAccount({
      t,
      onRetry,
      accountName: inWrongDeviceForAccount.accountName,
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
        managerAppName: error.managerAppName,
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
      });
    }

    // workaround to catch ECONNRESET error and show better message
    if (error?.message?.includes("ECONNRESET")) {
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
      error instanceof UserRefusedFirmwareUpdate ||
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

  if ((!isLoading && !device) || unresponsive) {
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
 */

export default function DeviceAction<R, H extends States, P>({
  action,
  request,
  ...props
}: InnerProps<P> & {
  action: Action<R, H, P>;
  request: R;
}): JSX.Element {
  const device = useSelector(getCurrentDevice);
  const hookState = action.useHook(device, request);
  const payload = action.mapResult(hookState);

  return (
    <DeviceActionDefaultRendering
      status={hookState}
      request={request}
      payload={payload}
      {...props}
    />
  );
}
