import React from "react";
import { Flex, Icons, Text } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import { PortfolioRange } from "@ledgerhq/types-live";

type Props = {
  title: string;
  description: string;
  top: number;
  range: PortfolioRange;
};

export function Error({ title, description, top, range }: Props) {
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
        {t(title, {
          count: top,
          trend: t(`dashboard.marketPerformanceWidget.trend.${range}`),
        })}
      </Text>

      <Text variant="small" fontWeight="medium" color="neutral.c70" textAlign="center">
        {t(description)}
      </Text>
    </Flex>
  );
}
