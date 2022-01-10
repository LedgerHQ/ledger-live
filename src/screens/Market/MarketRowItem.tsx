import React, { memo } from "react";
import styled from "styled-components/native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { CurrencyData } from "@ledgerhq/live-common/lib/market/types";
import { Image } from "react-native";
import { TFunction } from "i18next";
import CircleCurrencyIcon from "../../components/CircleCurrencyIcon";
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
  counterCurrency: string;
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
    isLiveSupported,
  } = item;

  return (
    <Flex
      height={72}
      flexDirection="row"
      justifyContent="flex-start"
      alignItems="center"
      p={3}
      key={index}
    >
      {isLiveSupported && internalCurrency ? (
        <CircleCurrencyIcon
          size={32}
          currency={internalCurrency}
          color={undefined}
        />
      ) : (
        image && (
          <IconContainer>
            <Image
              source={{ uri: image }}
              style={{ width: 32, height: 32 }}
              resizeMode="contain"
            />
          </IconContainer>
        )
      )}
      <Flex
        mx="4"
        flexDirection="column"
        justifyContent="center"
        alignItems="flex-start"
      >
        <Text variant="large" fontWeight="semiBold">
          {name}
        </Text>
        <Flex flexDirection="row">
          <Text
            variant="small"
            bg="neutral.c40"
            height="20px"
            lineHeight="20px"
            px="2"
            mr="2"
            borderRadius={2}
            fontWeight="semiBold"
          >
            {marketcapRank || "-"}
          </Text>
          <Text variant="body" color="neutral.c70">
            {marketcap && marketcap > 0
              ? counterValueFormatter({
                  value: marketcap,
                  shorten: true,
                  currency: counterCurrency,
                  locale,
                  t,
                })
              : "-"}
          </Text>
        </Flex>
      </Flex>
      <Flex
        flexDirection="column"
        justifyContent="center"
        alignItems="flex-end"
        flex={1}
      >
        <Text variant="large" fontWeight="semiBold">
          {counterValueFormatter({
            value: price,
            currency: counterCurrency,
            locale,
            t,
          })}
        </Text>

        {priceChangePercentage !== null && !isNaN(priceChangePercentage) ? (
          <DeltaVariation percent value={priceChangePercentage} />
        ) : (
          <Text variant="body" height="50px" width="50px" color="neutral.c70">
            {" "}
            -
          </Text>
        )}
      </Flex>
    </Flex>
  );
}

export default memo<Props>(MarketRowItem);
