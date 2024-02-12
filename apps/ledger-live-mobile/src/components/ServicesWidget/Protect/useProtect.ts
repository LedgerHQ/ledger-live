import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useLoginURI, useLearnMoreURI } from "@ledgerhq/live-common/hooks/recoverFeatureFlag";
import { useMemo } from "react";
import { Linking } from "react-native";
import { track } from "../../../analytics";

export function useProtect() {
  const servicesConfig = useFeature("protectServicesMobile");

  const loginURI = useLoginURI(servicesConfig);
  const learnMoreURI = useLearnMoreURI(servicesConfig);

  const onLearnMore = () => {
    const url = `${learnMoreURI}`;
    Linking.canOpenURL(url).then(() => Linking.openURL(url));
  };

  const onLogin = () => {
    const url = `${loginURI}`;
    Linking.canOpenURL(url).then(() => Linking.openURL(url));
  };

  const onClickCard = () => {
    onLearnMore();
    trackEvent("card_clicked", "Recover Card");
  };

  const onClickSignIn = () => {
    onLogin();
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
    () => servicesConfig?.enabled && learnMoreURI && loginURI,
    [loginURI, learnMoreURI, servicesConfig?.enabled],
  );

  return {
    displayService,
    onClickCard,
    onClickSignIn,
    onClickFreeTrial,
  };
}
