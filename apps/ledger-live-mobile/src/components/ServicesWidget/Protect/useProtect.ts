import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import {
  useLearnMoreURI,
  useLoginURI,
  useAlreadySubscribedURI,
} from "@ledgerhq/live-common/hooks/recoverFeatureFlag";
import { useMemo } from "react";
import { Linking } from "react-native";
import { track } from "../../../analytics";
import { urls } from "../../../config/urls";

export function useProtect() {
  const servicesConfig = useFeature("protectServicesMobile");

  const loginURI = useLoginURI(servicesConfig);
  const learnMoreURI = useLearnMoreURI(servicesConfig);
  const alreadySubscribedURI = useAlreadySubscribedURI(servicesConfig);

  const onLogin = () => {
    const url = `${loginURI}&source=${urls.recoverSources.myLedger}`;
    Linking.canOpenURL(url).then(() => Linking.openURL(url));
  }

  const onLearnMore = () => {
    const url = `${learnMoreURI}&source=${urls.recoverSources.myLedger}`;
    Linking.canOpenURL(url).then(() => Linking.openURL(url));
  };

  const onAlreadySubscribe = () => {
    const url = `${alreadySubscribedURI}&source=${urls.recoverSources.myLedger}`;
    Linking.canOpenURL(url).then(() => Linking.openURL(url));
  };

  const onClickCard = () => {
    onLogin();
    trackEvent("card_clicked", "Recover Card");
  };

  const onClickSignIn = () => {
    onAlreadySubscribe();
    trackEvent("button_clicked", "Sign In Recover");
  };
  const onClickFreeTrial = () => {
    onLearnMore();
    trackEvent("button_clicked", "Try for Free Recover");
  };

  const trackEvent = (eventName: "button_clicked" | "card_clicked", name: string) => {
    track(eventName, {
      ...(eventName === "button_clicked" && { button: name }),
      ...(eventName === "card_clicked" && { card: name }),
    });
  };

  const displayService = useMemo(
    () => servicesConfig?.enabled && learnMoreURI && alreadySubscribedURI,
    [alreadySubscribedURI, learnMoreURI, servicesConfig?.enabled],
  );

  return {
    displayService,
    onClickCard,
    onClickSignIn,
    onClickFreeTrial,
  };
}
