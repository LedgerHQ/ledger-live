import React from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import { MarketCurrencyData, KeysPriceChange } from "@ledgerhq/live-common/market/utils/types";
import { useTranslation } from "react-i18next";
import { useLocale } from "~/context/Locale";
import DeltaVariation from "LLM/features/Market/components/DeltaVariation";
import { counterValueFormatter } from "LLM/features/Market/utils";
import { StyledIconContainer } from "./MarketRowItem.styled";
import Icon from "@ledgerhq/crypto-icons/native";
import { Image } from "react-native";

type Props = {
  index: number;
  item: MarketCurrencyData;
  counterCurrency?: string;
  range?: string;
};

function MarketRowItem({ item, index, counterCurrency, range }: Props) {
  const { locale } = useLocale();
  const { t } = useTranslation();
  const { name, marketcap, marketcapRank, price, ticker } = item;

  const priceChangePercentage = item?.priceChangePercentage[range as KeysPriceChange];

  return (
    <Flex
      height={72}
      flexDirection="row"
      justifyContent="flex-start"
      alignItems="center"
      py="16px"
      key={index}
    >
      <StyledIconContainer>
        {item?.ledgerIds && item?.ledgerIds.length > 0 && item?.ticker ? (
          <Icon ledgerId={item?.ledgerIds?.[0]} ticker={item?.ticker} size={32} />
        ) : (
          <Image
            source={{ uri: item?.image }}
            style={{ width: 32, height: 32 }}
            accessibilityLabel="currency logo"
            resizeMode="contain"
          />
        )}
      </StyledIconContainer>

      <Flex mx="4" flexDirection="column" justifyContent="center" alignItems="flex-start" flex={1}>
        <Text
          variant="large"
          fontWeight="semiBold"
          numberOfLines={1}
          testID={`market-row-title-${ticker.toLocaleUpperCase()}`}
        >
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
