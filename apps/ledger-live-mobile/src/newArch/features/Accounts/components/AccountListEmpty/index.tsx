import { Text } from "@ledgerhq/native-ui";
import React from "react";
import { Trans } from "react-i18next";

export default function AccountListEmpty() {
  return (
    <Text color="neutral.c100">
      <Trans i18nKey="transfer.receive.noAccount" />
    </Text>
  );
}
