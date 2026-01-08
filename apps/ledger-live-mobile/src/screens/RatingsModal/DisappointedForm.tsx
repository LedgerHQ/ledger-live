import React, { useCallback, useEffect, useMemo } from "react";
import { Flex } from "@ledgerhq/native-ui";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import VersionNumber from "react-native-version-number";
import { Platform } from "react-native";
import styled from "styled-components/native";
import { useSelector } from "~/context/hooks";
import { track, TrackScreen } from "~/analytics";
import useRatings from "~/logic/ratings";
import getWindowDimensions from "~/logic/getWindowDimensions";
import { lastSeenDeviceSelector, notificationsSelector } from "~/reducers/settings";
import { bleDevicesSelector } from "~/reducers/ble";
import { useSettings } from "~/hooks";

const { height } = getWindowDimensions();

const appVersion = `${VersionNumber.appVersion} (${VersionNumber.buildVersion})`;

const INTERNAL_FORM_COMPLETED_EVENT = "internal-form-completed";
const TYPEFORM_COMPLETE_SUBMISSION_REQUEST_ENDPOINT = "/complete-submission";

// TODO: Find a way to not code inside a string because we lose syntax highlighting, lint checking, etc.
const formInjectedJavaScript = `
  // Proxying network requests is the best way to handle typeform events as the website heavily relies on JS:
  // We can't use the url to detect when the form is completed as it does not update the URL
  // We can find a way to use the DOM to detect when the form is completed but we don't want users to see that
  // Hence intercepting the fetch call and checking the url is the most reliable and UX friendly way to handle this.

  window.fetch = new Proxy(window.fetch, {
    apply(actualFetch, that, args) {
      // Forward function call to the original fetch
      const result = Reflect.apply(actualFetch, that, args);

      // Handle form events
      result
        .then(response => {
          try {
            const url = new URL(response.url);

            if (url.hostname !== "form.typeform.com") {
              return;
            }

            if (url.pathname.endsWith("${TYPEFORM_COMPLETE_SUBMISSION_REQUEST_ENDPOINT}")) {
              window.ReactNativeWebView.postMessage("${INTERNAL_FORM_COMPLETED_EVENT}");
              return;
            }
          } catch (e) {
            // Silently ignore errors from URL parsing or missing properties
          }
        })
        .catch(function () {
          // Swallow errors to avoid unhandled promise rejections from the proxied fetch
        });

      return result;
    },
  });
`;

const StyledWebview = styled(WebView)`
  background-color: transparent; // avoids white background before page loads
  flex: 1;
`;

type Props = {
  setStep: (step: "disappointedDone") => void;
  equipmentId: string | null;
  closeModal: () => void;
};

const DisappointedForm = ({ setStep, equipmentId, closeModal }: Props) => {
  const { ratingsHappyMoment, ratingsFeatureParams } = useRatings();
  const { language } = useSettings();
  const devices = useSelector(bleDevicesSelector);
  const lastDevice = useSelector(lastSeenDeviceSelector) ?? devices.at(-1);

  const notifications = useSelector(notificationsSelector);

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

      switch (data) {
        case INTERNAL_FORM_COMPLETED_EVENT: {
          track("button_clicked", {
            flow: "review",
            page: "review_disappointedstep2",
            button: "form_submitted",
            source: ratingsHappyMoment?.route_name,
            params: ratingsFeatureParams,
          });
          setStep("disappointedDone");
          break;
        }
        default: {
          if (__DEV__) {
            console.warn("Unknown form event:", data);
          }
          break;
        }
      }
    },
    [ratingsFeatureParams, ratingsHappyMoment?.route_name, setStep],
  );

  const formUrl = useMemo(() => {
    if (!ratingsFeatureParams?.typeform_url) {
      console.error(`Typeform URL is required, please set one in the ratings feature params`);
      return null;
    }

    let url: URL;
    try {
      url = new URL(ratingsFeatureParams.typeform_url);
    } catch {
      console.error(
        `Typeform URL is an invalid URL, Currently having: ${ratingsFeatureParams.typeform_url}`,
      );
      return null;
    }

    url.hash = `app_version=${appVersion}`;

    url.searchParams.set("app_language", language);
    url.searchParams.set("platform_os", Platform.OS);
    url.searchParams.set("platform_version", Platform.Version.toString());
    url.searchParams.set("model_id", lastDevice?.modelId ?? "");
    url.searchParams.set("firmware_version", lastDevice?.deviceInfo?.version ?? "");

    url.searchParams.set("notifications_allowed", notifications.areNotificationsAllowed.toString());
    const notificationsBlacklisted = Object.entries(notifications)
      .filter(([key, value]) => key !== "areNotificationsAllowed" && value === false)
      .map(([key]) => key)
      .join(",");
    url.searchParams.set("notifications_blacklisted", notificationsBlacklisted);

    if (equipmentId) {
      url.searchParams.set("equipment_id", equipmentId);
    }

    return url.toString();
  }, [
    ratingsFeatureParams?.typeform_url,
    equipmentId,
    language,
    lastDevice?.modelId,
    lastDevice?.deviceInfo?.version,
    notifications,
  ]);

  useEffect(() => {
    if (!formUrl) {
      closeModal();
      return;
    }
  }, [formUrl, closeModal]);

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
        {formUrl ? (
          <StyledWebview
            source={{ uri: formUrl }}
            originWhitelist={["https://*.typeform.com"]}
            injectedJavaScript={formInjectedJavaScript}
            onLoadEnd={onLoadEnd}
            onMessage={onMessage}
          />
        ) : null}
      </Flex>
    </Flex>
  );
};

export default DisappointedForm;
