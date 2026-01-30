import React, { useCallback, useEffect, useMemo } from "react";
import { useSelector } from "LLD/hooks/redux";
import { useNavigate, useLocation, useParams } from "react-router";
import { useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useOnboardingStatePolling } from "@ledgerhq/live-common/onboarding/hooks/useOnboardingStatePolling";
import { OnboardingStep } from "@ledgerhq/live-common/hw/extractOnboardingState";
import {
  counterValueCurrencySelector,
  developerModeSelector,
  devicesModelListSelector,
  languageSelector,
  localeSelector,
} from "~/renderer/reducers/settings";
import WebRecoverPlayer from "~/renderer/components/WebRecoverPlayer";
import useTheme from "~/renderer/hooks/useTheme";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import styled from "styled-components";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import { SeedOriginType } from "@ledgerhq/types-live";
import { DeviceModelId } from "@ledgerhq/devices";
import { getCountryCodeFromLocale } from "@ledgerhq/live-common/locale/index";

const pollingPeriodMs = 1000;

export type RecoverComponentParams = {
  appId: string;
};

export type RecoverState = {
  fromOnboarding?: boolean;
  deviceId?: string;
  seedConfiguration?: SeedOriginType;
};

const FullscreenWrapper = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 20;
  background-color: ${p => p.theme.colors.background.default};
`;

export default function RecoverPlayer() {
  const params = useParams<RecoverComponentParams>();
  const location = useLocation();
  const { search } = location;
  const state = location.state as RecoverState | undefined;
  const navigate = useNavigate();
  const queryParams = useMemo(() => Object.fromEntries(new URLSearchParams(search)), [search]);
  const locale = useSelector(languageSelector);
  const userLocale = useSelector(localeSelector);
  const devicesModelList = useSelector(devicesModelListSelector);
  const currencySettings = useSelector(counterValueCurrencySelector);
  const hasConnectedNanoS = useMemo(
    () => devicesModelList.includes(DeviceModelId.nanoS),
    [devicesModelList],
  );
  const countryCode = useMemo(() => getCountryCodeFromLocale(userLocale), [userLocale]);
  const localManifest = useLocalLiveAppManifest(params.appId || "");
  const remoteManifest = useRemoteLiveAppManifest(params.appId || "");
  const manifest = localManifest || remoteManifest;
  const theme = useTheme().theme;
  const onClose = useCallback(() => navigate(-1), [navigate]);
  const recoverConfig = useFeature("protectServicesDesktop");

  const availableOnDesktop = recoverConfig?.enabled && recoverConfig?.params?.availableOnDesktop;
  const currency = currencySettings.ticker;

  const device = useSelector(getCurrentDevice);
  const devModeEnabled = useSelector(developerModeSelector);

  const { onboardingState } = useOnboardingStatePolling({
    device: device || null,
    pollingPeriodMs,
    // stop polling if not coming from the onboarding
    stopPolling: !(state?.fromOnboarding || queryParams.fromOnboarding),
  });

  useEffect(() => {
    if (
      onboardingState &&
      onboardingState.currentOnboardingStep !== OnboardingStep.RecoverRestore
    ) {
      onClose();
    }
  }, [onClose, onboardingState]);

  const inputs = useMemo(
    () => ({
      theme,
      lang: locale,
      availableOnDesktop,
      deviceId: state?.deviceId,
      deviceModelId: device?.modelId,
      devModeEnabled,
      currency,
      hasConnectedNanoS,
      countryCode,
      ...params,
      ...queryParams,
    }),
    /**
     * deviceModelId is purposely ignored from dependencies.
     *
     * This is to ensure the WebRecoverPlayer is not reloaded given the user disconnects their cable.
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      theme,
      locale,
      availableOnDesktop,
      state?.deviceId,
      currency,
      hasConnectedNanoS,
      countryCode,
      params,
      queryParams,
    ],
  );

  return manifest ? (
    <FullscreenWrapper>
      <WebRecoverPlayer manifest={manifest} inputs={inputs} onClose={onClose} />
    </FullscreenWrapper>
  ) : null; // TODO: display an error component instead of `null`
}
