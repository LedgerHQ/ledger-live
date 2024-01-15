import React, { useCallback, useState } from "react";
import { Flex } from "@ledgerhq/native-ui";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import VersionNumber from "react-native-version-number";
import { Platform } from "react-native";
import styled from "styled-components/native";
import { useSelector } from "react-redux";
import { TrackScreen } from "~/analytics";
import useNpsRatings from "~/logic/npsRatings";
import getWindowDimensions from "~/logic/getWindowDimensions";
import { screen } from "~/analytics/segment";
import { lastSeenDeviceSelector, notificationsSelector } from "~/reducers/settings";
import { knownDevicesSelector } from "~/reducers/ble";
import { useSettings } from "~/hooks";

const { height } = getWindowDimensions();

const appVersion = `${VersionNumber.appVersion || ""} (${VersionNumber.buildVersion || ""})`;

const injectedJavascript = `
const ratingOptions = document.querySelectorAll('div[data-qa="nps-opinion-scale-step"]');

function handleRatingOptionClick(event) {
  const target = event.target;
  const ratingOption = target.closest('div[data-qa="nps-opinion-scale-step"]');
  if (ratingOption) {
    const rate = ratingOption.getAttribute('data-value-number');
    window.ReactNativeWebView.postMessage('nps-submit-' + rate);
  }
}

document.addEventListener('click', handleRatingOptionClick);

// MutationObserver to observe changes in the DOM and handle dynamically added rating options
const observer = new MutationObserver((mutationsList) => {
  for (const mutation of mutationsList) {
    if (mutation.addedNodes) {
      for (const node of mutation.addedNodes) {
        if (node.matches && node.matches('div[data-qa="nps-opinion-scale-step"]')) {
          node.addEventListener('click', handleRatingOptionClick);
        }
      }
    }
  }
});

// Configuration for the observer
const config = { childList: true, subtree: true };

// Start observing the target node
observer.observe(document.body, config);

document.addEventListener('click', (event) => {
  const target = event.target;
  if (target.matches('button[data-qa*="submit-button"]')) {
    window.ReactNativeWebView.postMessage('form-submit');
  }
});

true;
`;

const StyledWebview = styled(WebView)`
  background-color: transparent; // avoids white background before page loads
  flex: 1;
`;

type Props = {
  setStep: (t: string) => void;
};

const Form = ({ setStep }: Props) => {
  const { ratingsHappyMoment, ratingsFeatureParams, updateNpsRating } = useNpsRatings();
  const { language } = useSettings();
  const devices = useSelector(knownDevicesSelector);
  const lastDevice = useSelector(lastSeenDeviceSelector) || devices[devices.length - 1];
  const [selectedRate, setSelectedRate] = useState<number>();

  const notifications = useSelector(notificationsSelector);
  const notificationsAllowed = notifications.areNotificationsAllowed;
  const notificationsBlacklisted = Object.entries(notifications)
    .filter(([key, value]) => key !== "areNotificationsAllowed" && value === false)
    .map(([key]) => key)
    .join(",");

  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      const { data } = event.nativeEvent;
      if (data.startsWith("nps-submit")) {
        const rate = parseInt(data.split("-")[2], 10);
        setSelectedRate(rate);
        if (rate <= 8) {
          screen(
            "",
            "NPS Step 2 not Happy",
            { page: "NPS Step 2 not Happy", source: ratingsHappyMoment?.route_name, flow: "NPS" },
            true,
          );
        } else {
          screen(
            "",
            "NPS Step 2 Happy",
            { page: "NPS Step 2 Happy", source: ratingsHappyMoment?.route_name, flow: "NPS" },
            true,
          );
        }
      }
      if (data === "form-submit") {
        updateNpsRating(selectedRate as number);
        if (!selectedRate || selectedRate <= 7) {
          setStep("disappointedDone");
        } else {
          setStep("enjoy");
        }
      }
    },
    [ratingsHappyMoment?.route_name, selectedRate, setStep, updateNpsRating],
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
    <Flex flex={1} height={height * (1 / 2)}>
      <TrackScreen
        flow="NPS"
        name="NPS Step 1 Rating"
        page="NPS Step 1 Rating"
        source={ratingsHappyMoment?.route_name}
        category="NPS"
      />
      <Flex flex={1} overflow="hidden" mt={-50}>
        <StyledWebview
          source={{ uri: encodeURI(formUrl) }}
          originWhitelist={["*"]}
          injectedJavaScript={injectedJavascript}
          onMessage={onMessage}
        />
      </Flex>
    </Flex>
  );
};

export default Form;
