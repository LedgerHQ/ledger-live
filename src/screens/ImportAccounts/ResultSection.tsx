// @flow
import React, { memo } from "react";
import { Trans } from "react-i18next";
import { Text, Flex, InvertTheme } from "@ledgerhq/native-ui";

type Props = { mode: string };

function ResultSection({ mode }: Props) {
  let text;
  switch (mode) {
    case "create":
      text = <Trans i18nKey="account.import.result.newAccounts" />;
      break;
    case "update":
      text = <Trans i18nKey="account.import.result.updatedAccounts" />;
      break;
    case "empty":
      text = <Trans i18nKey="account.import.result.empty" />;
      break;
    case "id":
      text = <Trans i18nKey="account.import.result.alreadyImported" />;
      break;
    case "unsupported":
      text = <Trans i18nKey="account.import.result.unsupported" />;
      break;
    case "settings":
      text = <Trans i18nKey="account.import.result.settings" />;
      break;
    default:
      text = "";
  }
  return (
    <Flex mt={6} p={5} bg="neutral.c30" borderRadius={4}>
      <Text fontWeight="semiBold" variant="subtitle" color="neutral.c70">
        {text}
      </Text>
    </Flex>
  );
}

export default memo<Props>(ResultSection);
