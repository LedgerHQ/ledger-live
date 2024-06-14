import React from "react";
import { Success } from "../../components/Success";
import { useTranslation } from "react-i18next";
import { Instance } from "~/renderer/reducers/walletSync";
import { Flex } from "@ledgerhq/react-ui";

type Props = {
  instance: Instance | null;
};

export default function DeletionFinalStep({ instance }: Props) {
  const { t } = useTranslation();
  const title = "walletSync.manageInstances.deleteInstanceSuccess";
  return (
    <Flex flexDirection="column" alignItems="center" justifyContent="center" height="100%">
      <Success
        title={t(title, {
          instanceName: instance?.name,
        })}
      />
    </Flex>
  );
}
