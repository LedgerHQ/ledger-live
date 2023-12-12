import React, { memo } from "react";
import styled from "styled-components/native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { CurrencyData } from "@ledgerhq/live-common/market/types";
import { Image } from "react-native";
import { TFunction } from "i18next";
import CircleCurrencyIcon from "~/components/CircleCurrencyIcon";
import DeltaVariation from "./DeltaVariation";
import { counterValueFormatter } from "./utils";

export const IconContainer = styled(Flex).attrs({
  width: 32,
  height: 32,
  bg: "neutral.c30",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
})`
  border-radius: 32px;
  overflow: hidden;
`;

type Props = {
  index: number;
  item: CurrencyData;
  counterCurrency?: string;
  locale: string;
  t: TFunction;
};

function MarketRowItem({ item, index, counterCurrency, locale, t }: Props) {
  const {
    internalCurrency,
    image,
    name,
    marketcap,
    marketcapRank,
    price,
    priceChangePercentage,
    ticker,
  } = item;

  let loc = locale;
  // TEMPORARY : quick win to transform arabic to english
  if (locale === "ar") {
    loc = "en";
  }
  return (
    <Flex
      height={72}
      flexDirection="row"
      justifyContent="flex-start"
      alignItems="center"
      py="16px"
      key={index}
    >
      {internalCurrency ? (
        <CircleCurrencyIcon
          size={32}
          currency={internalCurrency}
          color={undefined}
          sizeRatio={0.9}
        />
      ) : (
        image && (
          <IconContainer>
            <Image source={{ uri: image }} style={{ width: 30, height: 30 }} resizeMode="contain" />
          </IconContainer>
        )
      )}
      <Flex mx="4" flexDirection="column" justifyContent="center" alignItems="flex-start" flex={1}>
        <Text variant="large" fontWeight="semiBold" numberOfLines={1}>
          {`${name} (${ticker.toLocaleUpperCase()})`}
        </Text>
        <Flex flexDirection="row" alignItems="center">
          <Text
            variant="small"
            bg="neutral.c40"
            height="15px"
            lineHeight="15px"
            px="4px"
            mr="3"
            borderRadius={4}
            overflow="hidden"
            fontWeight="semiBold"
          >
            {marketcapRank || "-"}
          </Text>
          <Text variant="body" color="neutral.c70" fontWeight="semiBold">
            {marketcap && marketcap > 0
              ? counterValueFormatter({
                  value: marketcap,
                  shorten: true,
                  currency: counterCurrency,
                  locale: loc,
                  t,
                })
              : "-"}
          </Text>
        </Flex>
      </Flex>
      <Flex flexDirection="column" justifyContent="center" alignItems="flex-end">
        <Text variant="large" fontWeight="semiBold">
          {counterValueFormatter({
            value: price,
            currency: counterCurrency,
            locale: loc,
            t,
          })}
        </Text>

        {priceChangePercentage !== null && !isNaN(priceChangePercentage) ? (
          <DeltaVariation percent value={priceChangePercentage} />
        ) : (
          <Text variant="body" color="neutral.c70">
            {" "}
            -
          </Text>
        )}
      </Flex>
    </Flex>
  );
}

export default memo<Props>(MarketRowItem, () => true);
