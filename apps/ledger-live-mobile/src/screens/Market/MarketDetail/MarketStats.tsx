import React, { useMemo } from "react";
import styled from "styled-components/native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { CurrencyData } from "@ledgerhq/live-common/market/types";
import { useLocale } from "~/context/Locale";
import { counterValueFormatter } from "../utils";
import DeltaVariation from "../DeltaVariation";

const StatRowContainer = styled(Flex).attrs({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  my: 4,
})``;

const Separator = styled(Flex).attrs({
  width: "100%",
  my: 24,
  height: 1,
  bg: "neutral.c40",
})``;

const Title = styled(Text).attrs({
  variant: "h3",
  color: "neutral.c100",
})``;

const Label = styled(Text).attrs({
  variant: "body",
  color: "neutral.c70",
})``;

const TextLabel = styled(Text).attrs({
  variant: "body",
  color: "neutral.c100",
})``;

const SubLabel = styled(Text).attrs({
  variant: "small",
  color: "neutral.c70",
})``;

const StatValue = styled(Flex).attrs({
  flex: 1,
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "flex-end",
})``;

const StatRow = ({ label, children }: { label: string; children?: React.ReactNode }) => (
  <StatRowContainer>
    <Label>{label}</Label>
    <StatValue>{children}</StatValue>
  </StatRowContainer>
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

  let loc = locale;
  // TEMPORARY : quick win to transform arabic to english
  if (locale === "ar") {
    loc = "en";
  }

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
      <Title>{t("market.detailsPage.priceStatistics")}</Title>
      <StatRow label={t("market.detailsPage.price")}>
        <TextLabel>
          {counterValueFormatter({
            currency: counterCurrency,
            value: price,
            locale: loc,
            t,
          })}
        </TextLabel>
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
        <TextLabel>
          {counterValueFormatter({
            currency: counterCurrency,
            value: totalVolume,
            locale: loc,
            t,
          })}
        </TextLabel>
      </StatRow>
      <StatRow label={t("market.detailsPage.24hLowHight")}>
        <TextLabel>
          {counterValueFormatter({
            currency: counterCurrency,
            value: low24h,
            locale: loc,
            t,
          })}{" "}
          /{" "}
          {counterValueFormatter({
            currency: counterCurrency,
            value: high24h,
            locale: loc,
            t,
          })}
        </TextLabel>
      </StatRow>
      <StatRow label={t("market.detailsPage.allTimeHigh")}>
        <TextLabel>
          {counterValueFormatter({
            currency: counterCurrency,
            value: ath,
            locale: loc,
            t,
          })}{" "}
        </TextLabel>
        <SubLabel>{athDate ? dateFormatter.format(athDate) : "-"}</SubLabel>
      </StatRow>
      <StatRow label={t("market.detailsPage.allTimeLow")}>
        <TextLabel>
          {counterValueFormatter({
            currency: counterCurrency,
            value: atl,
            locale: loc,
            t,
          })}{" "}
        </TextLabel>
        <SubLabel>{atlDate ? dateFormatter.format(atlDate) : "-"}</SubLabel>
      </StatRow>
      <Separator />
      <Title>{t("market.marketList.marketCap")}</Title>
      <StatRow label={t("market.marketList.marketCap")}>
        {typeof marketcap === "number" ? (
          <TextLabel>
            {counterValueFormatter({
              currency: counterCurrency,
              value: marketcap,
              locale: loc,
              t,
            })}
          </TextLabel>
        ) : null}
      </StatRow>
      <StatRow label={t("market.detailsPage.marketCapRank")}>
        <TextLabel bg="neutral.c40" px={2} py={1} overflow="hidden" borderRadius={4}>
          {marketcapRank}
        </TextLabel>
      </StatRow>
      <Separator />
      <Title>{t("market.detailsPage.supply")}</Title>
      <StatRow label={t("market.detailsPage.circulatingSupply")}>
        <TextLabel>
          {counterValueFormatter({
            value: circulatingSupply,
            locale: loc,
            t,
          })}
        </TextLabel>
      </StatRow>
      <StatRow label={t("market.detailsPage.totalSupply")}>
        <TextLabel>
          {counterValueFormatter({
            value: totalSupply,
            locale: loc,
            t,
          })}
        </TextLabel>
      </StatRow>
      <StatRow label={t("market.detailsPage.maxSupply")}>
        <TextLabel>
          {counterValueFormatter({
            value: maxSupply,
            locale: loc,
            t,
          })}
        </TextLabel>
      </StatRow>
    </Flex>
  );
}
