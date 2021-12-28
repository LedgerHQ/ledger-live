import React, { memo } from "react";
import styled from "styled-components/native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { CurrencyData } from "@ledgerhq/live-common/lib/market/types";
import { Image } from "react-native";
import { TFunction } from "i18next";
import CurrencyIcon from "../../components/CurrencyIcon";

const IconContainer = styled(Flex).attrs({
  width: 32,
  height: 32,
  bg: "neutral.c30",
})`
  border-radius: 32px;
  overflow: hidden;
`;

const indexes: [string, number][] = [
  ["d", 1],
  ["K", 1000],
  ["M", 1000000],
  ["B", 1000000000],
  ["T", 1000000000000],
  ["Q", 1000000000000000],
  ["Qn", 1000000000000000000],
];

export const counterValueFormatter = ({
  currency,
  value,
  shorten,
  locale,
  t,
}: {
  currency?: string;
  value: number;
  shorten?: boolean;
  locale: string;
  t: TFunction;
}): string => {
  if (!value) {
    return "-";
  }

  if (shorten) {
    const index = Math.floor(Math.log(value) / Math.log(10) / 3);

    const [i, n] = indexes[index];

    const roundedValue = Math.floor((value / n) * 1000) / 1000;

    const nn = new Intl.NumberFormat(locale, {
      style: currency ? "currency" : "decimal",
      currency,
      notation: shorten ? "compact" : "standard",
      maximumFractionDigits: 8,
      maximumSignificantDigits: 8,
    });

    const number = nn.format(roundedValue);

    const I = t(`numberCompact.${i}`);

    const formattedNumber = number.replace(/([0-9,. ]+)/, `$1 ${I} `);

    return formattedNumber;
  }

  return new Intl.NumberFormat(locale, {
    style: currency ? "currency" : "decimal",
    currency,
    maximumFractionDigits: 8,
  }).format(value);
};

type Props = {
  index: number;
  item: CurrencyData;
  counterCurrency: string;
  locale: string;
  t: TFunction;
};

function MarketRowItem({ item, index, counterCurrency, locale, t }: Props) {
  const { internalCurrency, image, name, marketcap, marketcapRank } = item;

  return (
    <Flex height={72} flexDirection="row" p={3} key={index}>
      {internalCurrency ? (
        <CurrencyIcon borderRadius={32} size={32} currency={internalCurrency} />
      ) : (
        image && (
          <IconContainer>
            <Image
              source={{ uri: image }}
              style={{ width: 32, height: 32 }}
              resizeMode="cover"
            />
          </IconContainer>
        )
      )}
      <Flex flexDirection="column">
        <Text variant="paragraph">{name}</Text>
        <Flex flexDirection="row">
          <Text variant="small" bg="neutral.c40" borderRadius={2}>
            {marketcapRank}
          </Text>
          <Text variant="body" color="neutral.c70">
            {counterValueFormatter({
              value: marketcap,
              shorten: true,
              currency: counterCurrency,
              locale,
              t,
            })}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  );
}

export default memo<Props>(MarketRowItem);
