import React from "react";
import { Error } from "../../components/Error";
import { useTranslation } from "react-i18next";
import { Flex } from "@ledgerhq/react-ui";
import type { KeyRingMember } from "@features/platform-key-ring";

export type FinalStepProps = {
  instance: KeyRingMember | null;
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
