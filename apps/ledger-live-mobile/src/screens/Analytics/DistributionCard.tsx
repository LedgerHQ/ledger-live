import React, { useCallback, useMemo } from "react";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getCurrencyColor } from "@ledgerhq/live-common/currencies/index";
import styled, { useTheme } from "styled-components/native";
import { Text, Flex } from "@ledgerhq/native-ui";
import { TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import ProgressBar from "~/components/ProgressBar";
import CounterValue from "~/components/CounterValue";
import { ensureContrast } from "../../colors";
import CurrencyIcon from "~/components/CurrencyIcon";
import { withDiscreetMode } from "~/context/DiscreetModeContext";
import { NavigatorName, ScreenName } from "~/const";

export type DistributionItem = {
  currency: CryptoCurrency | TokenCurrency;
  distribution: number; // % of the total (normalized in 0-1)
  amount: number;
  countervalue?: number; // countervalue of the amount that was calculated based of the rate provided
};

type Props = {
  item: DistributionItem;
};

const Container = styled(TouchableOpacity)`
  align-items: center;
  justify-content: center;
  margin-bottom: 32px;
  width: 100%;
`;

const IconContainer = styled(Flex).attrs({
  marginRight: 6,
  alignItems: "center",
  justifyContent: "center",
})``;

const CoinInfoContainer = styled(Flex).attrs({
  flexGrow: 1,
  flexShrink: 1,
  flexDirection: "column",
})``;

const CurrencyRow = styled(Flex).attrs({
  flexDirection: "row",
  justifyContent: "space-between",
  flexWrap: "wrap",
})``;

const RateRow = styled(Flex).attrs({
  flexDirection: "row",
  justifyContent: "space-between",
  flexWrap: "wrap",
})``;

const DistributionRow = styled(Flex).attrs({
  marginTop: 4,
  flexDirection: "row",
  alignItems: "center",
})``;

function DistributionCard({ item: { currency, amount, distribution } }: Props) {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const color = useMemo(
    () => ensureContrast(getCurrencyColor(currency), colors.background.main),
    [colors, currency],
  );
  const percentage = Math.round(distribution * 1e4) / 1e2;

  const navigateToAccounts = useCallback(() => {
    navigation.navigate(NavigatorName.Accounts, {
      screen: ScreenName.Asset,
      params: {
        currency,
      },
    });
  }, [currency, navigation]);

  return (
    <Container onPress={navigateToAccounts}>
      <Flex flexDirection="row">
        <IconContainer>
          <Flex
            bg={color}
            width={"32px"}
            height={"32px"}
            alignItems={"center"}
            justifyContent={"center"}
            borderRadius={32}
          >
            <CurrencyIcon currency={currency} size={20} color={colors.constant.white} />
          </Flex>
        </IconContainer>
        <CoinInfoContainer>
          <CurrencyRow>
            <Text variant="large" color="neutral.c100" fontWeight="semiBold">
              {currency.name}
            </Text>
            <Text variant="large" color="neutral.c100" fontWeight="semiBold">
              {`${percentage}%`}
            </Text>
          </CurrencyRow>
          <RateRow>
            <Text variant="body" color="neutral.c70" fontWeight="medium">
              <CurrencyUnitValue unit={currency.units[0]} value={amount} />
            </Text>
            <Text variant="body" color="neutral.c70" fontWeight="medium">
              <CounterValue currency={currency} value={amount} />
            </Text>
          </RateRow>
        </CoinInfoContainer>
      </Flex>
      <DistributionRow>
        <ProgressBar
          progress={percentage || 0}
          progressColor={color}
          backgroundColor={colors.neutral.c40}
        />
      </DistributionRow>
    </Container>
  );
}

export default withDiscreetMode(DistributionCard);
