import React, { memo } from "react";
import { Box, Flex, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import GradientContainer from "~/components/GradientContainer";

function EmptyAccountCard({ currencyTicker }: { currencyTicker: string }) {
  const { t } = useTranslation();

  return (
    <Box mt={8}>
      <GradientContainer>
        <Flex flex={1} px={10} py={11} alignItems="center" justifyContent="center">
          <Text variant="large" fontWeight="semiBold" color="neutral.c100" textAlign="center">
            {t("account.modals.zeroBalanceDisabledAction.title", {
              currencyTicker,
            })}
          </Text>
          <Text variant="small" fontWeight="medium" color="neutral.c70" textAlign="center" mt={3}>
            {t("account.modals.zeroBalanceDisabledAction.start", {
              currencyTicker,
            })}
          </Text>
        </Flex>
      </GradientContainer>
    </Box>
  );
}

export default memo(EmptyAccountCard);
