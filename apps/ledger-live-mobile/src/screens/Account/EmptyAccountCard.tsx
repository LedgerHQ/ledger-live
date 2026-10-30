import React, { memo } from "react";
import { Box, Flex, Text } from "@ledgerhq/native-ui";
import { Coins } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "~/context/Locale";
import GradientContainer from "~/components/GradientContainer";

function EmptyAccountCard({ currencyTicker, plain }: { currencyTicker: string; plain?: boolean }) {
  const { t } = useTranslation();

  if (plain) {
    return (
      <Flex alignItems="center" pt={8}>
        <Coins size={40} color="base" />
        <Text variant="large" fontWeight="semiBold" color="neutral.c100" textAlign="center" mt={6}>
          {t("accountDetailHero.emptyState.title")}
        </Text>
        <Text variant="small" fontWeight="medium" color="neutral.c70" textAlign="center" mt={2}>
          {t("accountDetailHero.emptyState.description.receiveSwapBuy")}
        </Text>
      </Flex>
    );
  }

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
