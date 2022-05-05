import React, { useCallback } from "react";
import { Flex } from "@ledgerhq/native-ui";
import { WebView } from "react-native-webview";
import styled from "styled-components/native";
import { track } from "../../analytics";
import useRatings from "../../logic/ratings";

const injectedJavascript = `
setTimeout(function() {
  const submitButton = document.querySelector('button[data-qa*="submit-button"]');
  submitButton.addEventListener('click', () => {
    window.ReactNativeWebView.postMessage('form-submit');
  });
}, 100);

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
  const onMessage = useCallback(
    event => {
      const { data } = event.nativeEvent;

      if (data === "form-submit") {
        track("FeedbackReceived", { source: ratingsHappyMoment.route_name });
        setStep("disappointedDone");
      }
    },
    [ratingsHappyMoment.route_name, setStep],
  );

  return (
    <Flex flex={1} height={400}>
      <StyledWebview
        source={{ uri: ratingsFeatureParams?.typeform_url }}
        originWhitelist={["*"]}
        javaScriptEnabledAndroid={true}
        injectedJavaScript={injectedJavascript}
        onMessage={onMessage}
      />
    </Flex>
  );
};

export default DisappointedForm;
