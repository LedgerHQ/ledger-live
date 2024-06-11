import React from "react";
//import { Error } from "../../components/Error";
import { Success } from "../../components/Success";
import { useTranslation } from "react-i18next";
import { Flex } from "@ledgerhq/react-ui";

export default function SyncFinalStep() {
  const { t } = useTranslation();
  const title = "walletSync.success.synch.title";
  const desc = "walletSync.success.synch.desc";
  return (
    <Flex flex={1}>
      <Success title={t(title)} description={t(desc)} />
    </Flex>
  );
}
