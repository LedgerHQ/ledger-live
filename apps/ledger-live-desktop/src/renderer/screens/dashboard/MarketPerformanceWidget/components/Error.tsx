import React from "react";
import { Flex, Icons, Text } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";

type Props = {
  title: string;
  description: string;
};

export function Error({ title, description }: Props) {
  const { t } = useTranslation();

  return (
    <Flex flexDirection="column" alignItems="center" justifyContent="center" flex={1}>
      <Flex
        borderRadius={50}
        width={"60px"}
        height={"60px"}
        bg="opacityDefault.c10"
        alignItems="center"
        justifyContent="center"
      >
        <Icons.WarningFill color="palette.warning.c70" size="S" />
      </Flex>

      <Text
        variant="paragraph"
        fontWeight="semiBold"
        color="neutral.c100"
        textAlign="center"
        mt={4}
        mb={4}
      >
        {t(title)}
      </Text>

      <Text variant="small" fontWeight="medium" color="neutral.c70" textAlign="center">
        {t(description)}
      </Text>
    </Flex>
  );
}
