import React, { memo } from "react";
import { DomainServiceResponseError } from "@ledgerhq/domain-service/hooks/types";
import { View, StyleSheet, Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { InvalidDomain, NoResolution } from "@ledgerhq/domain-service/errors/index";
import TranslatedError from "~/components/TranslatedError";
import SupportLinkError from "~/components/SupportLinkError";
import LText from "~/components/LText";
import Alert from "~/components/Alert";

type BasicErrorsProps = {
  error: Error | undefined | null;
  warning: Error | undefined | null;
  domainError: DomainServiceResponseError | null;
  domainErrorHandled: boolean;
  isForwardResolution: boolean;
};

export const BasicErrorsView = memo(
  ({ error, warning, domainError, domainErrorHandled, isForwardResolution }: BasicErrorsProps) => {
    // if no error or warning to show, ignore
    if (!error && !warning) return null;

    const hasNoResolutionButIsReverseResolution =
      domainErrorHandled && domainError?.error instanceof NoResolution && !isForwardResolution;

    if (!domainErrorHandled || hasNoResolutionButIsReverseResolution) {
      return (
        <>
          <LText
            style={[styles.warningBox]}
            color={error ? "alert" : warning ? "orange" : "darkBlue"}
          >
            <TranslatedError error={error || warning} />
          </LText>
          <View
            style={{
              display: "flex",
              alignItems: "flex-start",
            }}
          >
            <SupportLinkError error={error} type="alert" />
          </View>
        </>
      );
    }
    return null;
  },
);
BasicErrorsView.displayName = "BasicErrorView";

type DomainErrorsProps = {
  domainError: DomainServiceResponseError;
  isForwardResolution: boolean;
};

export const DomainErrorsView = memo(({ domainError, isForwardResolution }: DomainErrorsProps) => {
  const { t } = useTranslation();

  if ((domainError.error as Error) instanceof InvalidDomain) {
    return (
      <Alert
        title={t("send.recipient.domainService.invalidDomain.title")}
        type="warning"
        learnMoreKey="common.learnMore"
        learnMoreUrl="https://support.ledger.com/hc/articles/9710787581469?docs=true"
      >
        <LText>{t("send.recipient.domainService.invalidDomain.description")}</LText>
      </Alert>
    );
  }

  if ((domainError.error as Error) instanceof NoResolution && isForwardResolution) {
    return <Alert title={t("send.recipient.domainService.noResolution.title")} type="secondary" />;
  }

  return null;
});
DomainErrorsView.displayName = "DomainErrorsView";

const styles = StyleSheet.create({
  warningBox: {
    marginTop: 8,
    ...Platform.select({
      android: {
        marginLeft: 6,
      },
    }),
  },
});
