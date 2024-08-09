import React, { useMemo } from "react";
import { useTheme } from "@react-navigation/native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import CircleCurrencyIcon from "~/components/CircleCurrencyIcon";

const ICON_SIZE = 20;

type Props = {
  currencies: AppManifest["currencies"];
};

export default function CurrencyIconList({ currencies }: Props) {
  const { colors } = useTheme();

  const icons = useMemo(() => {
    if (!Array.isArray(currencies)) {
      return null;
    }

    const list = currencies
      .filter(currencies => !currencies.includes("*") && !currencies.includes("/"))
      .slice(0, 3)
      .map((currencyId, index) => {
        try {
          const currency = getCryptoCurrencyById(currencyId);
          return (
            <Flex
              key={currencyId}
              marginLeft={index !== 0 ? -3 : 0}
              borderColor={colors.background}
              borderStyle={"solid"}
              borderWidth={1}
              borderRadius={50}
            >
              <CircleCurrencyIcon currency={currency} size={ICON_SIZE} />
            </Flex>
          );
        } catch (err) {
          if (err instanceof Error) {
            // eslint-disable-next-line no-console
            console.log("currency doesn't exist: ", err.message);
          }
          return null;
        }
      });

    if (list.length !== currencies.length) {
      list.push(
        <Flex
          key={"+rest"}
          alignItems={"center"}
          justifyContent={"center"}
          marginLeft={-3}
          backgroundColor={colors.card}
          borderColor={colors.border}
          borderStyle={"solid"}
          borderWidth={1}
          borderRadius={50}
        >
          <Text
            textAlign={"center"}
            minWidth={ICON_SIZE}
            height={ICON_SIZE}
            lineHeight={`${ICON_SIZE}px`}
            fontSize={ICON_SIZE / 2}
            fontWeight="semiBold"
            px={3}
          >
            +{currencies.length - list.length}
          </Text>
        </Flex>,
      );
    }

    return list;
  }, [colors.background, colors.border, colors.card, currencies]);

  return <Flex flexDirection={"row"}>{icons}</Flex>;
}
