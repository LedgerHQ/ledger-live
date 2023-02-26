import React, { useEffect, Component } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { Action } from "@ledgerhq/live-common/hw/actions/types";
import {
  OutdatedApp,
  LatestFirmwareVersionRequired,
  DeviceNotOnboarded,
  NoSuchAppOnProvider,
  EConnResetError,
} from "@ledgerhq/live-common/errors";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { setPreferredDeviceModel, setLastSeenDeviceInfo } from "~/renderer/actions/settings";
import { preferredDeviceModelSelector } from "~/renderer/reducers/settings";
import { DeviceModelId } from "@ledgerhq/devices";
import AutoRepair from "~/renderer/components/AutoRepair";
import TransactionConfirm from "~/renderer/components/TransactionConfirm";
import SignMessageConfirm from "~/renderer/components/SignMessageConfirm";
import useTheme from "~/renderer/hooks/useTheme";
import { ManagerNotEnoughSpaceError, UpdateYourApp, TransportStatusError } from "@ledgerhq/errors";
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
  renderLockedDeviceError,
  RenderDeviceNotOnboardedError,
} from "./rendering";
import { useGetSwapTrackingProperties } from "~/renderer/screens/exchange/Swap2/utils";

type Props<R, H, P> = {
  overridesPreferredDeviceModel?: DeviceModelId;
  Result?: React.ComponentType<P>;
  onResult?: (_: P) => void;
  onError?: () => void;
  action: Action<R, H, P>;
  request: R;
  status?: H;
  payload?: P | null | undefined;
  analyticsPropertyFlow?: string; // if there are some events to be sent, there will be a property "flow" with this value (e.g: "send"/"receive"/"add account" etc.)
};

class OnResult<R, H, P> extends Component<P & { onResult: Props<R, H, P>["onResult"] }> {
  componentDidMount() {
    const { onResult } = this.props;
    onResult && onResult(this.props);
  }

  render() {
    return null;
  }
}

export const DeviceActionDefaultRendering = <R, H, P>({
  status: hookState,
  payload,
  request,
  Result,
  onResult,
  onError,
  overridesPreferredDeviceModel,
  analyticsPropertyFlow,
}: DefaultRenderingProps<R, H, P>) => {
  const {
    appAndVersion,
    device,
    unresponsive,
    isLocked,
    error,
    isLoading,
    allowManagerRequestedWording,
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
    initSellRequested,
    initSellResult,
    initSellError,
    signMessageRequested,
  } = hookState;

  const dispatch = useDispatch();
  const preferredDeviceModel = useSelector(preferredDeviceModelSelector);
  const swapDefaultTrack = useGetSwapTrackingProperties();

  const type = useTheme("colors.palette.type");

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
    if (deviceInfo) {
      const lastSeenDevice = {
        modelId: device.modelId,
        deviceInfo,
      };

      dispatch(setLastSeenDeviceInfo({ lastSeenDevice, latestFirmware }));
    }
  }, [dispatch, device, deviceInfo, latestFirmware]);

  if (displayUpgradeWarning && appAndVersion) {
    return renderWarningOutdated({ appName: appAndVersion.name, passWarning });
  }

  if (repairModalOpened && repairModalOpened.auto) {
    return <AutoRepair onDone={closeRepairModal} />;
  }

  if (requestQuitApp) {
    return renderRequestQuitApp({ modelId, type });
  }

  if (installingApp) {
    const appName = requestOpenApp;
    const props = { type, modelId, appName, progress, request, analyticsPropertyFlow };
    return <InstallingApp {...props} />;
  }

  if (installingLanguage) {
    return renderInstallingLanguage({ progress, t });
  }

  if (requiresAppInstallation) {
    const { appName, appNames: maybeAppNames } = requiresAppInstallation;
    const appNames = maybeAppNames?.length ? maybeAppNames : [appName];

    return renderRequiresAppInstallation({ appNames });
  }

  if (allowManagerRequestedWording) {
    const wording = allowManagerRequestedWording;
    return renderAllowManager({ modelId, type, wording });
  }

  if (languageInstallationRequested) {
    return renderAllowLanguageInstallation({ modelId, type, t });
  }

  if (listingApps) {
    return renderListingApps();
  }

  if (completeExchangeStarted && !completeExchangeResult && !completeExchangeError) {
    const { exchangeType } = request;

    // FIXME: could use a TS enum (when LLD will be in TS) or a JS object instead of raw numbers for switch values for clarity
    switch (exchangeType) {
      // swap
      case 0x00: {
        // FIXME: should use `renderSwapDeviceConfirmationV2` but all params not available in hookState for this SDK exchange flow
        return <div>{"Confirm swap on your device"}</div>;
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
    const { transaction, exchange, exchangeRate, status } = request;
    const { amountExpectedTo, estimatedFees } = hookState;
    return renderSwapDeviceConfirmation({
      modelId,
      type,
      transaction,
      exchangeRate,
      exchange,
      status,
      amountExpectedTo,
      estimatedFees,
      swapDefaultTrack,
    });
  }

  if (initSellRequested && !initSellResult && !initSellError) {
    return renderSecureTransferDeviceConfirmation({ exchangeType: "sell", modelId, type });
  }

  if (allowOpeningRequestedWording || requestOpenApp) {
    // requestOpenApp for Nano S 1.3.1 (need to ask user to open the app.)
    const wording = allowOpeningRequestedWording || requestOpenApp;
    const tokenContext = request && request.tokenCurrency;
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
    if (
      error instanceof ManagerNotEnoughSpaceError ||
      error instanceof OutdatedApp ||
      error instanceof UpdateYourApp
    ) {
      return renderError({
        t,
        error,
        managerAppName: error.managerAppName,
      });
    }

    if (error instanceof LatestFirmwareVersionRequired) {
      return renderError({
        t,
        error,
        requireFirmwareUpdate: true,
      });
    }

    // NB Until we find a better way, remap the error if it's 6d06 (LNS, LNSP, LNX) or 6d07 (Stax) and we haven't fallen
    // into another handled case.
    if (
      error instanceof DeviceNotOnboarded ||
      (error instanceof TransportStatusError &&
        (error.message.includes("0x6d06") || error.message.includes("0x6d07")))
    ) {
      return <RenderDeviceNotOnboardedError t={t} device={device} />;
    }

    if (error instanceof NoSuchAppOnProvider) {
      return renderError({
        t,
        error,
        withOpenManager: true,
        withExportLogs: true,
      });
    }

    // workarround to catch ECONNRESET error and show better message
    if (error?.message?.includes("ECONNRESET")) {
      return renderError({
        error: new EConnResetError(),
        onRetry,
        withExportLogs: true,
      });
    }

    return renderError({
      t,
      error,
      onRetry,
      withExportLogs: true,
      device: device ?? undefined,
    });
  }

  // Renders an error as long as LLD is using the "event" implementation of device actions
  if (isLocked) {
    return renderLockedDeviceError({ t, device, onRetry });
  }

  if ((!isLoading && !device) || unresponsive) {
    return renderConnectYourDevice({
      modelId,
      type,
      unresponsive,
      device,
      onRepairModal,
      onRetry,
    });
  }

  if (isLoading || (allowOpeningGranted && !appAndVersion)) {
    return renderLoading({ modelId });
  }

  if (deviceInfo && deviceInfo.isBootloader) {
    return renderBootloaderStep({ onAutoRepair });
  }

  if (request && device && deviceSignatureRequested) {
    const { account, parentAccount, status, transaction } = request;
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
    const { account, parentAccount } = request;
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
      modelId,
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
      {onResult ? <OnResult onResult={onResult} {...payload} /> : null}
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
const DeviceAction = <R, H, P>({ action, request, ...props }: Props<R, H, P>) => {
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
};

type DefaultRenderingProps<R, H, P> = Omit<Props<R, H, P>, "device" | "action">;

export default DeviceAction;
