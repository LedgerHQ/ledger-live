import React, { useMemo } from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { CurrencyData } from "@ledgerhq/live-common/market/types";
import { useLocale } from "~/context/Locale";
import { counterValueFormatter } from "LLM/features/Market/utils";
import DeltaVariation from "LLM/features/Market/components/DeltaVariation";
import {
  StyledStatRowContainer,
  StyledSeparator,
  StyledTitle,
  StyledTextLabel,
  StyledLabel,
  StyledStatValue,
  StyledSubLabel,
} from "./MarketStats.styled";

const StatRow = ({ label, children }: { label: string; children?: React.ReactNode }) => (
  <StyledStatRowContainer>
    <StyledLabel>{label}</StyledLabel>
    <StyledStatValue>{children}</StyledStatValue>
  </StyledStatRowContainer>
);

export default function MarketStats({
  currency,
  counterCurrency,
}: {
  currency: CurrencyData;
  counterCurrency: string;
}) {
  const { t } = useTranslation();
  const { locale } = useLocale();

  const {
    marketcap,
    marketcapRank,
    totalVolume,
    high24h,
    low24h,
    circulatingSupply,
    totalSupply,
    maxSupply,
    ath,
    athDate: _athDate,
    atl,
    atlDate: _atlDate,
    price,
    priceChangePercentage,
  } = currency || {};

  const athDate = _athDate ? new Date(_athDate) : null;
  const atlDate = _atlDate ? new Date(_atlDate) : null;

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    [locale],
  );

  return (
    <Flex bg="neutral.c30" m={16} px={16} py={24} borderRadius={8}>
      <StyledTitle>{t("market.detailsPage.priceStatistics")}</StyledTitle>
      <StatRow label={t("market.detailsPage.price")}>
        <StyledTextLabel>
          {counterValueFormatter({
            currency: counterCurrency,
            value: price,
            locale,
            t,
          })}
        </StyledTextLabel>
        {priceChangePercentage !== null && !isNaN(priceChangePercentage) ? (
          <DeltaVariation percent value={priceChangePercentage} />
        ) : (
          <Text variant="body" color="neutral.c70">
            {" "}
            -
          </Text>
        )}
      </StatRow>
      <StatRow label={t("market.detailsPage.tradingVolume")}>
        <StyledTextLabel>
          {counterValueFormatter({
            currency: counterCurrency,
            value: totalVolume,
            locale,
            t,
          })}
        </StyledTextLabel>
      </StatRow>
      <StatRow label={t("market.detailsPage.24hLowHight")}>
        <StyledTextLabel>
          {counterValueFormatter({
            currency: counterCurrency,
            value: low24h,
            locale,
            t,
          })}{" "}
          /{" "}
          {counterValueFormatter({
            currency: counterCurrency,
            value: high24h,
            locale,
            t,
          })}
        </StyledTextLabel>
      </StatRow>
      <StatRow label={t("market.detailsPage.allTimeHigh")}>
        <StyledTextLabel>
          {counterValueFormatter({
            currency: counterCurrency,
            value: ath,
            locale,
            t,
          })}{" "}
        </StyledTextLabel>
        <StyledSubLabel>{athDate ? dateFormatter.format(athDate) : "-"}</StyledSubLabel>
      </StatRow>
      <StatRow label={t("market.detailsPage.allTimeLow")}>
        <StyledTextLabel>
          {counterValueFormatter({
            currency: counterCurrency,
            value: atl,
            locale,
            t,
          })}{" "}
        </StyledTextLabel>
        <StyledSubLabel>{atlDate ? dateFormatter.format(atlDate) : "-"}</StyledSubLabel>
      </StatRow>
      <StyledSeparator />
      <StyledTitle>{t("market.marketList.marketCap")}</StyledTitle>
      <StatRow label={t("market.marketList.marketCap")}>
        {typeof marketcap === "number" ? (
          <StyledTextLabel>
            {counterValueFormatter({
              currency: counterCurrency,
              value: marketcap,
              locale,
              t,
            })}
          </StyledTextLabel>
        ) : null}
      </StatRow>
      <StatRow label={t("market.detailsPage.marketCapRank")}>
        <StyledTextLabel bg="neutral.c40" px={2} py={1} overflow="hidden" borderRadius={4}>
          {marketcapRank}
        </StyledTextLabel>
      </StatRow>
      <StyledSeparator />
      <StyledTitle>{t("market.detailsPage.supply")}</StyledTitle>
      <StatRow label={t("market.detailsPage.circulatingSupply")}>
        <StyledTextLabel>
          {counterValueFormatter({
            value: circulatingSupply,
            locale,
            t,
          })}
        </StyledTextLabel>
      </StatRow>
      <StatRow label={t("market.detailsPage.totalSupply")}>
        <StyledTextLabel>
          {counterValueFormatter({
            value: totalSupply,
            locale,
            t,
          })}
        </StyledTextLabel>
      </StatRow>
      <StatRow label={t("market.detailsPage.maxSupply")}>
        <StyledTextLabel>
          {counterValueFormatter({
            value: maxSupply,
            locale,
            t,
          })}
        </StyledTextLabel>
      </StatRow>
    </Flex>
  );
}
