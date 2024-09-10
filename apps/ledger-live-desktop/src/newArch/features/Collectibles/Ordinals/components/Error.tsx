import React from "react";
import { Flex, Icons, Text } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";

const Error: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Flex justifyContent="center" my={4} columnGap={2}>
      <Icons.Warning size="S" color="error.c60" />
      <Text color="error.c60">{t("crash.title")}</Text>
    </Flex>
  );
};

export default Error;
