import React, { useCallback } from "react";
import { useSelector } from "react-redux";
import { Flex } from "@ledgerhq/native-ui";
import { WebView } from "react-native-webview";
import styled from "styled-components/native";
import { track } from "../../analytics";
import { ratingsHappyMomentSelector } from "../../reducers/ratings";

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
  setStep: any;
};

const DisappointedForm = ({ setStep }: Props) => {
  const ratingsHappyMoment = useSelector(ratingsHappyMomentSelector);
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
        source={{
          uri:
            "https://form.typeform.com/to/Jo7gqcB4?typeform-medium=embed-sdk&typeform-medium-version=next&typeform-embed=popup-blank",
        }}
        originWhitelist={["*"]}
        javaScriptEnabledAndroid={true}
        injectedJavaScript={injectedJavascript}
        onMessage={onMessage}
      />
    </Flex>
  );
};

export default DisappointedForm;
