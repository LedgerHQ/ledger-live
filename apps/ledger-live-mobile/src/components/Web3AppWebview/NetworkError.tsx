import React from "react";
import { Linking } from "react-native";
import { createCustomErrorClass } from "@ledgerhq/errors";
import { Trans } from "react-i18next";
import GenericErrorView from "../GenericErrorView";
import Button from "../Button";
import ExternalLink from "../ExternalLink";

const WebPTXPlayerNetworkFail = createCustomErrorClass(
  "WebPTXPlayerNetworkFail",
);

export const NetworkError = ({
  handleTryAgain,
}: {
  handleTryAgain: () => void;
}) => (
  <GenericErrorView error={new WebPTXPlayerNetworkFail()}>
    <Button
      mx={6}
      my={6}
      type="main"
      outline={false}
      event="button_clicked"
      eventProperties={{
        button: "Contact Ledger Support",
      }}
      onPress={handleTryAgain}
      size="large"
    >
      <Trans i18nKey="errors.WebPTXPlayerNetworkFail.primaryCTA" />{" "}
    </Button>
    <ExternalLink
      onPress={() => Linking.openURL("")}
      text={<Trans i18nKey="errors.WebPTXPlayerNetworkFail.contactSupport" />}
      type="main"
    />
  </GenericErrorView>
);
