import React, { useCallback } from "react";
import { Linking } from "react-native";
import { Trans } from "react-i18next";
import { urls } from "~/utils/urls";
import ExternalLink from "./ExternalLink";
import { LearnMoreLink } from "./Alert";

type Props = {
  error: Error | null | undefined;
  type?: "alert";
};

const SupportLinkError = ({ error, type }: Props) => {
  const maybeLink = error ? urls.errors[error.name as keyof typeof urls.errors] : null;
  const onOpen = useCallback(() => {
    maybeLink && Linking.openURL(maybeLink);
  }, [maybeLink]);
  if (!maybeLink) return null;
  return type === "alert" ? (
    <LearnMoreLink onPress={onOpen} />
  ) : (
    <ExternalLink
      onPress={onOpen}
      event="ErrorLearnMore"
      text={<Trans i18nKey="common.learnMore" />}
    />
  );
};

export default SupportLinkError;
