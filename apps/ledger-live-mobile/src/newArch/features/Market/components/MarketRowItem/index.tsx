import React from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import { CurrencyData } from "@ledgerhq/live-common/market/types";
import { Image } from "react-native";
import { useTranslation } from "react-i18next";
import CircleCurrencyIcon from "~/components/CircleCurrencyIcon";
import { StyledIconContainer } from "./MarketRowItem.styled";
import { useLocale } from "~/context/Locale";
import DeltaVariation from "LLM/features/Market/components/DeltaVariation";
import { counterValueFormatter } from "LLM/features/Market/utils";

type Props = {
  index: number;
  item: CurrencyData;
  counterCurrency?: string;
};

function MarketRowItem({ item, index, counterCurrency }: Props) {
  const { locale } = useLocale();
  const { t } = useTranslation();
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
          <StyledIconContainer>
            <Image source={{ uri: image }} style={{ width: 30, height: 30 }} resizeMode="contain" />
          </StyledIconContainer>
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
                  locale,
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
            locale,
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

export default MarketRowItem;
