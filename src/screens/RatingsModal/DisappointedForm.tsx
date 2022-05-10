import React, { useCallback } from "react";
import { Flex } from "@ledgerhq/native-ui";
import { WebView } from "react-native-webview";
import styled from "styled-components/native";
import { track, TrackScreen } from "../../analytics";
import useRatings from "../../logic/ratings";

const injectedJavascript = `
const interval = setInterval(addListenerOnFormSubmitButton, 100);
function addListenerOnFormSubmitButton() {
  const submitButton = document.querySelector('button[data-qa*="submit-button"]');
  if (submitButton) {
    submitButton.addEventListener('click', () => {
      window.ReactNativeWebView.postMessage('form-submit');
    });
  }
  clearInterval(interval);
}

true;
`;

const StyledWebview = styled(WebView)`
  background-color: transparent; // avoids white background before page loads
`;

type Props = {
  setStep: Function;
};

const DisappointedForm = ({ setStep }: Props) => {
  const { ratingsHappyMoment, ratingsFeatureParams } = useRatings();

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
    event => {
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

  return (
    <Flex flex={1} height={400}>
      <TrackScreen
        category="Review"
        name="page_viewed"
        flow="review"
        page="review_disappointedstep2"
        source={ratingsHappyMoment?.route_name}
        params={ratingsFeatureParams}
      />
      <StyledWebview
        source={{ uri: ratingsFeatureParams?.typeform_url }}
        originWhitelist={["*"]}
        javaScriptEnabledAndroid={true}
        injectedJavaScript={injectedJavascript}
        onLoadEnd={onLoadEnd}
        onMessage={onMessage}
      />
    </Flex>
  );
};

export default DisappointedForm;
