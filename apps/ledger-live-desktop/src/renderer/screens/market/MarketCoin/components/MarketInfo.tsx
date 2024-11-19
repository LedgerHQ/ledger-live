import React, { memo, useMemo } from "react";
import { Flex, Text } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import FormattedVal from "~/renderer/components/FormattedVal";
import LoadingPlaceholder from "~/renderer/components/LoadingPlaceholder";
import counterValueFormatter from "@ledgerhq/live-common/market/utils/countervalueFormatter";
import { dayAndHourFormat, useDateFormatted } from "~/renderer/hooks/useDateFormatter";
import { KeysPriceChange } from "@ledgerhq/live-common/market/utils/types";

const Title = styled(Text).attrs({ variant: "h5", color: "neutral.c100", mb: 2 })`
  font-size: 20px;
  line-height: 24px;
`;

const Label = styled(Text).attrs<{ color: string }>(p => ({
  variant: "paragraph",
  flexDirection: "column",
  color: p.color || "neutral.c80",
  flex: 1,
}))<{ color: string }>`
  font-size: 13px;
  line-height: 16px;
  min-height: 27px;
  position: relative;
`;

export const LoadingLabel = ({
  loading,
  color,
  children,
  ...props
}: {
  loading?: boolean;
  color?: string;
  children?: React.ReactNode;
}) => (
  <Label color={color || "neutral.c100"} {...props}>
    {loading ? <LoadingPlaceholder style={{ borderRadius: 8, overflow: "hidden" }} /> : children}
  </Label>
);

const ColumnRight = styled(Flex).attrs({
  flexDirection: "column",
  alignItems: "stretch",
  flex: 1,
})`
  ${Label} {
    text-align: right !important;
    align-items: flex-end !important;
  }
`;

const Block = styled(Flex).attrs({
  py: 3,
  px: 2,
  mt: 3,
  bg: "neutral.c30",
  borderRadius: "8px",
  flexDirection: "column",
})``;

const Line = styled(Flex).attrs({
  my: 2,
  flexDirection: "row",
  alignItems: "flex-start",
  justifyContent: "space-between",
})`
  ${Label}:nth-child(1) {
    align-items: flex-start;
    text-align: left;
  }
  ${Label}:nth-child(2) {
    text-align: right;
    align-items: flex-end;
  }
`;

type Props = {
  marketcap?: number;
  marketcapRank?: number;
  totalVolume?: number;
  high24h?: number;
  low24h?: number;
  price?: number;
  priceChangePercentage?: Record<KeysPriceChange, number>;
  marketCapChangePercentage24h?: number;
  circulatingSupply?: number;
  totalSupply?: number;
  maxSupply?: number;
  ath?: number;
  athDate?: string | Date;
  atl?: number;
  atlDate?: string | Date;
  counterCurrency: string;
  loading: boolean;
  locale: string;
  range: string;
};

function MarketInfo({
  marketcap,
  marketcapRank,
  totalVolume,
  high24h,
  low24h,
  price,
  priceChangePercentage,
  marketCapChangePercentage24h,
  circulatingSupply,
  totalSupply,
  maxSupply,
  ath,
  athDate,
  atl,
  atlDate,
  counterCurrency,
  loading,
  locale,
  range,
}: Props) {
  const { t } = useTranslation();

  const athDateD = useMemo(() => (athDate ? new Date(athDate) : undefined), [athDate]);
  const atlDateD = useMemo(() => (atlDate ? new Date(atlDate) : undefined), [atlDate]);
  const athText = useDateFormatted(athDateD, dayAndHourFormat);
  const atlText = useDateFormatted(atlDateD, dayAndHourFormat);

  const currentPriceChangePercentage = priceChangePercentage?.[range as KeysPriceChange];

  return (
    <Flex flexDirection="row" my={2} alignItems="flex-start" justifyContent="space-between">
      <Block flex="1">
        <Title>{t("market.detailsPage.priceStatistics")}</Title>
        <Line>
          <Label>{t("market.marketList.price")}</Label>
          <ColumnRight>
            <LoadingLabel loading={loading} data-testid="market-price-stats-price">
              {counterValueFormatter({ value: price, currency: counterCurrency, locale })}
            </LoadingLabel>
            <LoadingLabel loading={loading} data-testid="market-price-stats-variation">
              {currentPriceChangePercentage ? (
                <FormattedVal
                  isPercent
                  isNegative
                  val={parseFloat(currentPriceChangePercentage.toFixed(2))}
                  inline
                  withIcon
                />
              ) : (
                "-"
              )}
            </LoadingLabel>
          </ColumnRight>
        </Line>
        <Line>
          <Label>{t("market.detailsPage.tradingVolume")}</Label>
          <LoadingLabel loading={loading} data-testid="market-price-stats-trading-volume">
            {counterValueFormatter({ value: totalVolume, currency: counterCurrency, locale })}
          </LoadingLabel>
        </Line>
        <Line>
          <Label>{t("market.detailsPage.24hLowHight")}</Label>
          <LoadingLabel loading={loading} data-testid="market-price-stats-low-hight">
            {counterValueFormatter({ value: low24h, currency: counterCurrency, locale })}
            {" / "}
            {counterValueFormatter({ value: high24h, currency: counterCurrency, locale })}
          </LoadingLabel>
        </Line>
        <Line>
          <Label>{t("market.detailsPage.allTimeHigh")}</Label>
          <ColumnRight>
            <LoadingLabel loading={loading} data-testid="market-price-stats-ath">
              {counterValueFormatter({ value: ath, currency: counterCurrency, locale })}
            </LoadingLabel>
            <LoadingLabel
              color="neutral.c80"
              loading={loading}
              data-testid="market-price-stats-ath-date"
            >
              {athText || "-"}
            </LoadingLabel>
          </ColumnRight>
        </Line>
        <Line>
          <Label>{t("market.detailsPage.allTimeLow")}</Label>
          <ColumnRight>
            <LoadingLabel loading={loading} data-testid="market-price-stats-atl">
              {counterValueFormatter({ value: atl, currency: counterCurrency, locale })}
            </LoadingLabel>
            <LoadingLabel
              color="neutral.c80"
              loading={loading}
              data-testid="market-price-stats-atl-date"
            >
              {atlText || "-"}
            </LoadingLabel>
          </ColumnRight>
        </Line>
      </Block>
      <Flex flex="1" flexDirection="column" ml={3} alignItems="stretch" justifyContent="center">
        <Block>
          <Title>{t("market.marketList.marketCap")}</Title>
          <Line>
            <Label>{t("market.marketList.marketCap")}</Label>
            <LoadingLabel loading={loading} data-testid="market-cap">
              {counterValueFormatter({
                value: marketcap,
                currency: counterCurrency,
                locale,
                shorten: true,
              })}
            </LoadingLabel>
          </Line>
          <Line>
            <Label>{t("market.detailsPage.marketCapRank")}</Label>
            <LoadingLabel loading={loading} data-testid="market-cap-rank">
              {marketcapRank !== undefined
                ? `#${counterValueFormatter({
                    value: marketcapRank,
                    locale,
                  })}`
                : "-"}
            </LoadingLabel>
          </Line>
          <Line>
            <Label>{t("market.detailsPage.marketCapDominance")}</Label>
            <LoadingLabel loading={loading} data-testid="market-cap-dominance">
              {marketCapChangePercentage24h ? (
                <FormattedVal
                  isPercent
                  isNegative
                  val={parseFloat(marketCapChangePercentage24h.toFixed(2))}
                  inline
                  withIcon
                />
              ) : (
                "-"
              )}
            </LoadingLabel>
          </Line>
        </Block>
        <Block>
          <Title>{t("market.detailsPage.supply")}</Title>
          <Line>
            <Label>{t("market.detailsPage.circulatingSupply")}</Label>
            <LoadingLabel loading={loading} data-testid="market-circulating-supply">
              {counterValueFormatter({
                value: circulatingSupply,
                locale,
                shorten: true,
              })}
            </LoadingLabel>
          </Line>
          <Line>
            <Label>{t("market.detailsPage.totalSupply")}</Label>
            <LoadingLabel loading={loading} data-testid="market-total-supply">
              {counterValueFormatter({
                value: totalSupply,
                locale,
                shorten: true,
              })}
            </LoadingLabel>
          </Line>
          <Line>
            <Label>{t("market.detailsPage.maxSupply")}</Label>
            <LoadingLabel loading={loading} data-testid="market-max-supply">
              {counterValueFormatter({
                value: maxSupply,
                locale,
                shorten: true,
              })}
            </LoadingLabel>
          </Line>
        </Block>
      </Flex>
    </Flex>
  );
}

export default memo(MarketInfo);
