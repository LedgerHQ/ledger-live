import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { Linking, StyleSheet } from "react-native";
import { Text } from "@ledgerhq/native-ui";
import { sendRecipientCanNext } from "@ledgerhq/live-common/families/hedera/utils";
import type { TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";
import { urls } from "~/utils/urls";
import Alert from "~/components/Alert";
import TranslatedError from "~/components/TranslatedError";

interface AlertProps {
  error: Error;
}

const MissingAssociationAlert = ({ error }: AlertProps) => {
  return (
    <Alert
      type="warning"
      learnMoreUrl={urls.hedera.tokenAssociation}
      learnMoreKey="hedera.send.warnings.missingAssociation.learnMore"
    >
      <TranslatedError error={error} field="description" />
    </Alert>
  );
};

const UnverifiedAssociationAlert = ({ error }: AlertProps) => {
  return (
    <Alert
      type="warning"
      learnMoreUrl={urls.hedera.tokenAssociation}
      learnMoreKey="hedera.send.warnings.unverifiedAssociation.learnMore"
    >
      <TranslatedError error={error} field="description" />
    </Alert>
  );
};

const UnverifiedEvmAddressAlert = () => {
  const evmAddressVerificationUrl = useLocalizedUrl(urls.hedera.evmAddressVerification);

  const goToLink = useCallback(() => {
    Linking.openURL(evmAddressVerificationUrl);
  }, [evmAddressVerificationUrl]);

  return (
    <Alert type="warning">
      <Trans i18nKey="hedera.send.warnings.evmVerificationRequired.text">
        <Text
          onPress={goToLink}
          style={styles.textUnderline}
          variant="bodyLineHeight"
          fontWeight="semiBold"
        />
      </Trans>
    </Alert>
  );
};

interface Props {
  status: TransactionStatus;
}

const StepRecipientCustomAlert = ({ status }: Props) => {
  const { missingAssociation, unverifiedAssociation, unverifiedEvmAddress } = status.warnings;

  if (missingAssociation) {
    return <MissingAssociationAlert error={missingAssociation} />;
  }

  if (unverifiedAssociation) {
    return <UnverifiedAssociationAlert error={unverifiedAssociation} />;
  }

  if (unverifiedEvmAddress) {
    return <UnverifiedEvmAddressAlert />;
  }

  return null;
};

const styles = StyleSheet.create({
  textUnderline: {
    textDecorationLine: "underline",
  },
});

export default { sendRecipientCanNext, StepRecipientCustomAlert };
