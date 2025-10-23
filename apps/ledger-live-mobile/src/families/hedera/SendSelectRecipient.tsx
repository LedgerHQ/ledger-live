import React from "react";
import { sendRecipientCanNext } from "@ledgerhq/live-common/families/hedera/utils";
import type { TransactionStatus } from "@ledgerhq/live-common/generated/types";
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

export default { sendRecipientCanNext, StepRecipientCustomAlert };
