import React from "react";
import { Error } from "../../components/Error";
import { useTranslation } from "react-i18next";
import { Flex } from "@ledgerhq/react-ui";
import { TrustchainMember } from "@ledgerhq/ledger-key-ring-protocol/types";

export type FinalStepProps = {
  instance: TrustchainMember | null;
};

export default function DeletionErrorFinalStep({ instance }: FinalStepProps) {
  const { t } = useTranslation();
  const title = "walletSync.manageInstances.deleteInstanceError";
  return (
    <Flex flexDirection="column" alignItems="center" justifyContent="center" height="100%">
      <Error
        title={t(title, {
          instanceName: instance?.name,
        })}
      />
    </Flex>
  );
}
