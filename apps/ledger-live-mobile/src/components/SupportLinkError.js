// @flow
import React, { useCallback } from "react";
import { Linking } from "react-native";
import { Trans } from "react-i18next";
import { urls } from "../config/urls";
import ExternalLink from "./ExternalLink";

type Props = {
  error: ?Error,
};

const SupportLinkError = ({ error }: Props) => {
  const maybeLink = error ? urls.errors[error.name] : null;
  const onOpen = useCallback(() => {
    maybeLink && Linking.openURL(maybeLink);
  }, [maybeLink]);
  if (!maybeLink) return null;
  return (
    <ExternalLink
      onPress={onOpen}
      event="ErrorLearnMore"
      text={<Trans i18nKey="common.learnMore" />}
    />
  );
};

export default SupportLinkError;
