import React, { useCallback, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { RouteComponentProps, useHistory } from "react-router-dom";
import { useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/platform/providers/LocalLiveAppProvider/index";
import { useOnboardingStatePolling } from "@ledgerhq/live-common/onboarding/hooks/useOnboardingStatePolling";
import { OnboardingStep } from "@ledgerhq/live-common/hw/extractOnboardingState";
import { counterValueCurrencySelector, languageSelector } from "~/renderer/reducers/settings";
import WebRecoverPlayer from "~/renderer/components/WebRecoverPlayer";
import useTheme from "~/renderer/hooks/useTheme";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import styled from "styled-components";
<<<<<<< HEAD
import { useFeature } from "@ledgerhq/live-config/featureFlags/index";
=======
import { useFeature } from "@ledgerhq/live-config/FeatureFlags/index";
>>>>>>> f8e0133b13 (fix: refactoring)
import { StaticContext } from "react-router";

const pollingPeriodMs = 1000;

export type RecoverComponentParams = {
  appId: string;
};

export type RecoverState = {
  fromOnboarding?: boolean;
  deviceId?: string;
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
  background-color: ${p => p.theme.colors.palette.background.default};
`;

export default function RecoverPlayer({
  match,
  location,
}: RouteComponentProps<RecoverComponentParams, StaticContext, RecoverState | undefined>) {
  const { params } = match;
  const { search, state } = location;
  const queryParams = useMemo(() => Object.fromEntries(new URLSearchParams(search)), [search]);
  const locale = useSelector(languageSelector);
  const currencySettings = useSelector(counterValueCurrencySelector);
  const localManifest = useLocalLiveAppManifest(params.appId);
  const remoteManifest = useRemoteLiveAppManifest(params.appId);
  const manifest = localManifest || remoteManifest;
  const theme = useTheme().colors.palette.type;
  const history = useHistory();
  const onClose = useCallback(() => history.goBack(), [history]);
  const recoverConfig = useFeature("protectServicesDesktop");

  const availableOnDesktop = recoverConfig?.enabled && recoverConfig?.params?.availableOnDesktop;
  const currency = currencySettings.ticker;

  const device = useSelector(getCurrentDevice);

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
      currency,
      ...params,
      ...queryParams,
    }),
    [availableOnDesktop, locale, params, queryParams, state?.deviceId, currency, theme],
  );

  return manifest ? (
    <FullscreenWrapper>
      <WebRecoverPlayer manifest={manifest} inputs={inputs} onClose={onClose} />
    </FullscreenWrapper>
  ) : null; // TODO: display an error component instead of `null`
}
