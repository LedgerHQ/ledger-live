import React, { useCallback } from "react";
import { Flex } from "@ledgerhq/native-ui";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import VersionNumber from "react-native-version-number";
import { Platform } from "react-native";
import styled from "styled-components/native";
import { useSelector } from "react-redux";
import { track, TrackScreen } from "~/analytics";
import useRatings from "~/logic/ratings";
import getWindowDimensions from "~/logic/getWindowDimensions";
import { lastSeenDeviceSelector, notificationsSelector } from "~/reducers/settings";
import { knownDevicesSelector } from "~/reducers/ble";
import { useSettings } from "~/hooks";

const { height } = getWindowDimensions();

const appVersion = `${VersionNumber.appVersion || ""} (${VersionNumber.buildVersion || ""})`;

const injectedJavascript = `
const submitInterval = setInterval(addListenerOnFormSubmitButton, 100);
const alreadySubmittedInterval = setInterval(addListenerOnFormAlreadySubmittedButton, 100);

function addListenerOnFormSubmitButton() {
  const submitButton = document.querySelector('button[data-qa*="submit-button"]');
  if (submitButton) {
    clearInterval(submitInterval);
    clearInterval(alreadySubmittedInterval);
    submitButton.addEventListener('click', () => {
      window.ReactNativeWebView.postMessage('form-submit');
    });
  }
}

// If the user was too quick and we didn't catch the click on
// the submit button but the form has already been submitted
function addListenerOnFormAlreadySubmittedButton() {
  const alreadySubmittedButton = document.querySelector('button[data-qa*="thank-you-button"]');
  window.ReactNativeWebView.postMessage(alreadySubmittedButton);
  if (alreadySubmittedButton) {
    clearInterval(submitInterval);
    clearInterval(alreadySubmittedInterval);
    window.ReactNativeWebView.postMessage('form-submit');
  }
}

true;
`;

const StyledWebview = styled(WebView)`
  background-color: transparent; // avoids white background before page loads
  flex: 1;
`;

type Props = {
  setStep: (t: string) => void;
};

const DisappointedForm = ({ setStep }: Props) => {
  const { ratingsHappyMoment, ratingsFeatureParams } = useRatings();
  const { language } = useSettings();
  const devices = useSelector(knownDevicesSelector);
  const lastDevice = useSelector(lastSeenDeviceSelector) || devices[devices.length - 1];

  const notifications = useSelector(notificationsSelector);
  const notificationsAllowed = notifications.areNotificationsAllowed;
  const notificationsBlacklisted = Object.entries(notifications)
    .filter(([key, value]) => key !== "areNotificationsAllowed" && value === false)
    .map(([key]) => key)
    .join(",");

  const onLoadEnd = useCallback(() => {
    track("button_clicked", {
      flow: "review",
      page: "review_disappointedstep2",
      button: "typeform_loaded",
      source: ratingsHappyMoment?.route_name,
      params: ratingsFeatureParams,
    });
  }, [ratingsFeatureParams, ratingsHappyMoment?.route_name]);
  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      const { data } = event.nativeEvent;

      if (data === "form-submit") {
        track("button_clicked", {
          flow: "review",
          page: "review_disappointedstep2",
          button: "form_submitted",
          source: ratingsHappyMoment?.route_name,
          params: ratingsFeatureParams,
        });
        setStep("disappointedDone");
      }
    },
    [ratingsFeatureParams, ratingsHappyMoment?.route_name, setStep],
  );
  const formUrlSplitted = ratingsFeatureParams?.typeform_url.split("?");
  const formUrl =
    formUrlSplitted?.[0] +
    `#app_version=${appVersion}` +
    `&app_language=${language}` +
    `&platform_os=${Platform.OS}` +
    `&platform_version=${Platform.Version}` +
    `&model_id=${lastDevice?.modelId}` +
    `&firmware_version=${lastDevice?.deviceInfo?.version}` +
    `&notifications_allowed=${notificationsAllowed}` +
    `&notifications_blacklisted=${notificationsBlacklisted}` +
    `&done?${formUrlSplitted?.[1] || ""}`;

  return (
    <Flex flex={1} height={height * (4 / 5)}>
      <TrackScreen
        category="Review"
        name="page_viewed"
        flow="review"
        page="review_disappointedstep2"
        source={ratingsHappyMoment?.route_name}
        params={ratingsFeatureParams}
      />
      <Flex flex={1} borderRadius={16} overflow="hidden">
        <StyledWebview
          source={{ uri: encodeURI(formUrl) }}
          originWhitelist={["*"]}
          injectedJavaScript={injectedJavascript}
          onLoadEnd={onLoadEnd}
          onMessage={onMessage}
        />
      </Flex>
    </Flex>
  );
};

export default DisappointedForm;
