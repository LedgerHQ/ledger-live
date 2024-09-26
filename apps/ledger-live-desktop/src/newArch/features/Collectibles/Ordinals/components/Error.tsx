import React from "react";
import { Flex, Icons, Text } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";

type Props = {
  error: Error;
};

const Error: React.FC<Props> = ({ error }) => {
  const { t } = useTranslation();

  return (
    <Flex my={4} ml={4} alignItems={"center"} columnGap={2}>
      <Icons.Warning size="S" color="error.c60" />
      <Text color="error.c60">{t("crash.title")}</Text>
      <Text fontSize={12} alignSelf={"flex-end"} color="error.c40">{`(${error?.message})`}</Text>
    </Flex>
  );
};

export default Error;
