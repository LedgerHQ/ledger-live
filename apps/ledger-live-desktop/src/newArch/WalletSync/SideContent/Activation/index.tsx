import { Box, Flex, Icons, Text } from "@ledgerhq/react-ui";
import React, { PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";
import ButtonV3 from "~/renderer/components/ButtonV3";
import useTheme from "~/renderer/hooks/useTheme";

const LogoWrapper = ({ children, opacity = "70%" }: PropsWithChildren & { opacity?: string }) => (
  <Box>
    <Flex padding="7px" borderRadius="13px" border="1px solid hsla(0, 0%, 100%, 0.05)">
      <Flex
        borderRadius="9px"
        backgroundColor="hsla(248, 100%, 85%, 0.08)"
        padding="5px"
        opacity={opacity}
      >
        {children}
      </Flex>
    </Flex>
  </Box>
);

const WalletSyncActivation = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <Flex
      flexDirection="column"
      height="100%"
      paddingX="64px"
      alignSelf="center"
      justifyContent="center"
      rowGap="48px"
    >
      <Flex flexDirection="column" alignSelf="center" justifyContent="center" rowGap="24px">
        <Flex justifyContent="center" alignItems="center">
          <LogoWrapper>
            <Icons.Mobile color={colors.constant.purple} />
          </LogoWrapper>

          <LogoWrapper opacity="100%">
            <Icons.Refresh size="L" color={colors.constant.purple} />
          </LogoWrapper>

          <LogoWrapper>
            <Icons.Desktop color={colors.constant.purple} />
          </LogoWrapper>
        </Flex>

        <Text fontSize={24} variant="h4Inter" textAlign="center">
          {t("walletSync.activate.title")}
        </Text>
        <Text fontSize={14} variant="body" color="hsla(0, 0%, 58%, 1)" textAlign="center">
          {t("walletSync.activate.description")}
        </Text>
        <Flex justifyContent="center">
          <ButtonV3 variant="main"> {t("walletSync.activate.cta")}</ButtonV3>
        </Flex>
      </Flex>

      <Box>
        <Flex
          flexDirection="row"
          padding="18px"
          borderRadius="12px"
          backgroundColor={colors.opacityDefault.c05}
          justifyContent="space-between"
        >
          <Text variant="body" fontSize={14} flexShrink={1}>
            {t("walletSync.alreadySync.title")}
          </Text>
          <Box>
            <ButtonV3 variant="shade">{t("walletSync.alreadySync.cta")}</ButtonV3>
          </Box>
        </Flex>
      </Box>
    </Flex>
  );
};

export default WalletSyncActivation;
