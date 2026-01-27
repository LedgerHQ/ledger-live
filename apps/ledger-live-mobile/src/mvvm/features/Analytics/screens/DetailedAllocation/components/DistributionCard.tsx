import React, { useCallback, useMemo } from "react";
import { TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import styled, { useTheme } from "styled-components/native";
import { getCurrencyColor } from "@ledgerhq/live-common/currencies/index";
import { Flex, Text } from "@ledgerhq/native-ui";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { ensureContrast } from "~/colors";
import CounterValue from "~/components/CounterValue";
import CurrencyIcon from "~/components/CurrencyIcon";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import ProgressBar from "~/components/ProgressBar";
import { NavigatorName, ScreenName } from "~/const";
import { withDiscreetMode } from "~/context/DiscreetModeContext";
import { track } from "~/analytics";
import { DETAILED_ALLOCATION_PAGE } from "../../../const";

export type DistributionItem = Readonly<{
  currency: CryptoCurrency | TokenCurrency;
  amount: number;
  distribution: number;
}>;

type Props = Readonly<{
  item: DistributionItem;
}>;

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
  const percentage = useMemo(() => Math.round(distribution * 1e4) / 1e2, [distribution]);

  const navigateToAccounts = useCallback(() => {
    track("button_clicked", {
      button: "View Account",
      page: DETAILED_ALLOCATION_PAGE,
    });

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
          <CurrencyIcon currency={currency} size={35} />
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

export default React.memo(withDiscreetMode(DistributionCard));
