import React, { useCallback, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { RouteComponentProps, useHistory } from "react-router-dom";
import { useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/platform/providers/LocalLiveAppProvider/index";
import { useOnboardingStatePolling } from "@ledgerhq/live-common/onboarding/hooks/useOnboardingStatePolling";
import { OnboardingStep } from "@ledgerhq/live-common/hw/extractOnboardingState";
import { languageSelector } from "~/renderer/reducers/settings";
import WebRecoverPlayer from "~/renderer/components/WebRecoverPlayer";
import useTheme from "~/renderer/hooks/useTheme";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import styled from "styled-components";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { StaticContext } from "react-router";

const pollingPeriodMs = 1000;

export type RecoverComponentParams = {
  appId: string;
};

export type RecoverState = {
  fromOnboarding?: boolean;
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
`;

export default function RecoverPlayer({
  match,
  location,
}: RouteComponentProps<RecoverComponentParams, StaticContext, RecoverState | undefined>) {
  const { params } = match;
  const { search, state } = location;
  const queryParams = useMemo(() => Object.fromEntries(new URLSearchParams(search)), [search]);
  const locale = useSelector(languageSelector);
  const localManifest = useLocalLiveAppManifest(params.appId);
  const remoteManifest = useRemoteLiveAppManifest(params.appId);
  const manifest = localManifest || remoteManifest;
  const theme = useTheme().colors.palette.type;
  const history = useHistory();
  const onClose = useCallback(() => history.goBack(), [history]);
  const recoverConfig = useFeature("protectServicesDesktop");

  const availableOnDesktop = recoverConfig?.enabled && recoverConfig?.params?.availableOnDesktop;

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

  return manifest ? (
    <FullscreenWrapper>
      <WebRecoverPlayer
        manifest={manifest}
        inputs={{
          theme,
          lang: locale,
          availableOnDesktop,
          ...params,
          ...queryParams,
        }}
        onClose={onClose}
      />
    </FullscreenWrapper>
  ) : null; // TODO: display an error component instead of `null`
}
