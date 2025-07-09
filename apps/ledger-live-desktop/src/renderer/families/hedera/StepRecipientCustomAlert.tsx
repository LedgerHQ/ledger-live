import React from "react";
import { Trans } from "react-i18next";
import type { TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { urls } from "~/config/urls";
import Alert from "~/renderer/components/Alert";
import TranslatedError from "~/renderer/components/TranslatedError";

interface AlertProps {
  error: Error;
}

const MissingAssociationAlert = ({ error }: AlertProps) => {
  return (
    <Alert
      type="warning"
      mt={4}
      learnMoreUrl={urls.hedera.tokenAssociation}
      learnMoreLabel={<Trans i18nKey="hedera.send.warnings.missingAssociation.learnMore" />}
    >
      <TranslatedError error={error} field="description" />
    </Alert>
  );
};

const UnverifiedAssociationAlert = ({ error }: AlertProps) => {
  return (
    <Alert
      type="warning"
      mt={4}
      learnMoreUrl={urls.hedera.tokenAssociation}
      learnMoreLabel={<Trans i18nKey="hedera.send.warnings.unverifiedAssociation.learnMore" />}
    >
      <TranslatedError error={error} field="description" />
    </Alert>
  );
};

interface Props {
  status: TransactionStatus;
}

const StepRecipientCustomAlert = ({ status }: Props) => {
  const { missingAssociation, unverifiedAssociation } = status.warnings;

  if (missingAssociation) {
    return <MissingAssociationAlert error={missingAssociation} />;
  }

  if (unverifiedAssociation) {
    return <UnverifiedAssociationAlert error={unverifiedAssociation} />;
  }

  return null;
};

export default StepRecipientCustomAlert;
