import React from "react";
<<<<<<< HEAD
import { TouchableOpacity } from "react-native";
=======
import { StatusBar, TouchableOpacity } from "react-native";
>>>>>>> db4df5bda62a62a56aa13e956040a614f0554508
import { Flex, Icons, Text } from "@ledgerhq/native-ui";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useTranslation } from "react-i18next";
import CurrencyIcon from "../../../../components/CurrencyIcon";

interface Props {
  currency?: CryptoCurrency | TokenCurrency;
  title?: string;
  subTitle: string;
  onPress: () => void;
  disabled?: boolean;
}

export function Selector({
  currency,
  title,
  subTitle,
  onPress,
  disabled = false,
}: Props) {
  const { t } = useTranslation();

  const Icon = currency ? (
    <CurrencyIcon size={32} currency={currency} />
  ) : (
    <Flex
      width={32}
      height={32}
      justifyContent="center"
      backgroundColor="neutral.c30"
      borderRadius={16}
    />
  );

  return (
    <TouchableOpacity onPress={onPress} disabled={disabled}>
      <Flex
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        paddingY={4}
      >
        <Flex flexDirection="row" alignItems="center" minWidth={180}>
          <Flex alignItems="center" justifyContent="center">
            {Icon}
          </Flex>

          <Flex marginLeft={4} marginRight={4}>
            <Text
              variant="h3"
              marginBottom={2}
<<<<<<< HEAD
              color={title? "neutral.c100" : "neutral.c70"}
=======
              color={title ? "neutral.c100" : "neutral.c70"}
>>>>>>> db4df5bda62a62a56aa13e956040a614f0554508
            >
              {title || t("transfer.swap2.form.placeholder")}
            </Text>
            <Text
              variant="subtitle"
              color={title ? "neutral.c100" : "neutral.c70"}
            >
              {subTitle}
            </Text>
          </Flex>
        </Flex>

        <Icons.ChevronBottomRegular />
      </Flex>
    </TouchableOpacity>
  );
}
