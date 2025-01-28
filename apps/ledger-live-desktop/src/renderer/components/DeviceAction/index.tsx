import React, { useEffect } from "react";

import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { Action } from "@ledgerhq/live-common/hw/actions/types";

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

import useTheme from "~/renderer/hooks/useTheme";

import { useGetSwapTrackingProperties } from "~/renderer/screens/exchange/Swap2/utils";
import { DeviceModelInfo } from "@ledgerhq/types-live";

import { useKeepScreenAwake } from "~/renderer/hooks/useKeepScreenAwake";
import { walletSelector } from "~/renderer/reducers/wallet";
import { useTrackManagerSectionEvents } from "~/renderer/analytics/hooks/useTrackManagerSectionEvents";

import {
  stepAutoRepair,
  stepRequestQuitApp,
  stepWarningOutdated,
  stepInstallingApp,
  stepInstallingLanguage,
  stepRequiresAppInstallation,
  stepAllowManagerLanguageLockscreen,
  stepListingApps,
  stepCompleteExchangeStarted,
  stepInitSwapRequested,
  stepAllowOpeningApp,
  stepInWrongAppForAccount,
  stepUnresponsiveOrTransportError,
  stepErrorHandling,
  stepLockedDevice,
  stepConnectDevice,
  stepLoading,
  stepBootloader,
  stepDeviceSignature,
  stepSignMessage,
  stepDeviceStreaming,
  stepFinalPayload,
  States,
  InnerProps,
  Props,
  ExtendedRenderContext,
} from "./deviceActionSteps";

export function DeviceActionDefaultRendering<H extends States, P>({
  status: hookState,
  payload,
  request,
  onError,
  overridesPreferredDeviceModel,
  inlineRetry = true,
  analyticsPropertyFlow,
  location,
}: Props<H, P>) {
  const dispatch = useDispatch();

  const { device, deviceInfo, latestFirmware, error, manifestId, manifestName } = hookState;

  const preferredDeviceModel = useSelector(preferredDeviceModelSelector);
  const swapDefaultTrack = useGetSwapTrackingProperties();
  const stateSettings = useSelector(settingsSelector);
  const walletState = useSelector(walletSelector);
  const isTrackingEnabled = useSelector(trackingEnabledSelector);

  const theme = useTheme();
  const themeType = theme.colors.palette.type as "dark" | "light";
  const { t } = useTranslation();

  // analytics
  useTrackManagerSectionEvents({
    location,
    device,
    allowManagerRequested: hookState.allowManagerRequested,
    clsImageRemoved: hookState.imageRemoved,
    error,
    isTrackingEnabled,
  });

  useKeepScreenAwake(true);

  // determine the correct device model
  const modelId = device ? device.modelId : overridesPreferredDeviceModel || preferredDeviceModel;

  // update store's preferred device model
  useEffect(() => {
    if (modelId !== preferredDeviceModel) {
      dispatch(setPreferredDeviceModel(modelId));
    }
  }, [dispatch, modelId, preferredDeviceModel]);

  // if there's an error, call onError
  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  // save lastSeen device info if available
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

  // the “context” for steps
  const ctx: ExtendedRenderContext<H, P> = {
    hookState,
    payload,
    request,
    inlineRetry,
    modelId,
    type: themeType,
    swapDefaultTrack,
    stateSettings,
    walletState,
    t,
    analyticsPropertyFlow,
    manifestId: manifestId ?? null,
    manifestName: manifestName ?? null,
  };

  return [
    stepWarningOutdated,
    stepAutoRepair,
    stepRequestQuitApp,
    stepInstallingApp,
    stepInstallingLanguage,
    stepRequiresAppInstallation,
    stepAllowManagerLanguageLockscreen,
    stepListingApps,
    stepCompleteExchangeStarted,
    stepInitSwapRequested,
    stepAllowOpeningApp,
    stepInWrongAppForAccount,
    stepUnresponsiveOrTransportError,
    stepErrorHandling,
    stepLockedDevice,
    stepConnectDevice,
    stepLoading,
    stepBootloader,
    stepDeviceSignature,
    stepSignMessage,
    stepDeviceStreaming,
    stepFinalPayload,
  ].reduce<React.JSX.Element | null>((acc, step) => acc || step(ctx), null);
}

/**
 * Perform an action involving a device.
 * @prop action: one of the actions/*
 * @prop request: an object that is the input of that action
 * @prop Result optional: an action produces a result, this gives a component to render it
 * @prop onResult optional: an action produces a result, this gives a callback to be called with it
 * @prop location optional: an action might need to know the location for analytics
 */
export default function DeviceAction<H extends States, P>({
  action,
  request,
  location,
  ...rest
}: InnerProps<P> & {
  action: Action<unknown, H, P>;
  request: unknown;
}) {
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
      {...rest}
    />
  );
}
