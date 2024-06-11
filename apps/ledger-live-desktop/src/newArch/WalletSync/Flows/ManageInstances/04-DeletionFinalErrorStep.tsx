import React from "react";
import { Error } from "../../components/Error";
import { useTranslation } from "react-i18next";
import { Instance } from "~/renderer/reducers/walletSync";
import { Flex } from "@ledgerhq/react-ui";

type Props = {
  instance: Instance | null;
};

export default function DeletionErrorFinalStep({ instance }: Props) {
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
