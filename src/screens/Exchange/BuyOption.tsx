import React from "react";
import { TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { Box, Flex, Text } from "@ledgerhq/native-ui";
import styled from "styled-components/native";
import ProviderBullet from "./ProviderBullet";

type BuyOptionProps = {
  name: string;
  icon: React.ReactNode;
  supportedCoinsCount: number;
  onPress: Function;
  isActive: boolean;
};

const SelectablePartnerCard = styled(TouchableOpacity)<{ isActive?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  min-width: 100%;
  padding: ${p => p.theme.space[4]}px;
  margin-top: ${p => p.theme.space[2]}px;
  margin-bottom: ${p => p.theme.space[2]}px;
  background-color: ${p =>
    p.isActive ? p.theme.colors.primary.c20 : "transparent"};
  border-radius: 4px;
  border-width: 1px;
  border-color: ${p =>
    p.isActive ? p.theme.colors.primary.c80 : p.theme.colors.neutral.c40};
`;

export default function BuyOption(props: BuyOptionProps) {
  const { t } = useTranslation();
  const { icon, name, supportedCoinsCount, onPress, isActive } = props;

  return (
    <SelectablePartnerCard onPress={onPress} isActive={isActive}>
      <Flex flexDirection={"row"} alignItems={"center"}>
        <Box width={"40px"} height={"40px"}>
          {icon}
        </Box>
        <Text variant={"body"} ml={4}>
          {name}
        </Text>
      </Flex>
      <ProviderBullet text={t("exchange.buy.bullets.whereToBuy")} />
      <ProviderBullet
        text={`${supportedCoinsCount}+ ${t(
          "exchange.buy.bullets.cryptoSupported",
        )}`}
      />
      <ProviderBullet text={t("exchange.buy.bullets.payWith")} />
    </SelectablePartnerCard>
  );
}
