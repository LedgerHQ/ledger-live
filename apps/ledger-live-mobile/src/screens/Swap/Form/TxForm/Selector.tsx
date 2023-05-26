import React from "react";
import { TouchableOpacity } from "react-native";
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
    <CurrencyIcon size={28} currency={currency} />
  ) : (
    <Flex
      width={28}
      height={28}
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
        width="100%"
      >
        <Flex flexDirection="row" alignItems="center" flex={1}>
          <Flex alignItems="center" justifyContent="center" marginRight={2}>
            {Icon}
          </Flex>

          <Flex flex={1} marginRight={2}>
            <Text
              variant="large"
              marginBottom={2}
              ellipsizeMode="middle"
              numberOfLines={1}
              color={title ? "neutral.c100" : "neutral.c70"}
            >
              {title || t("transfer.swap2.form.placeholder")}
            </Text>

            <Text variant="subtitle" color={"neutral.c70"}>
              {subTitle}
            </Text>
          </Flex>
        </Flex>

        <Flex>
          <Icons.ChevronBottomMedium />
        </Flex>
      </Flex>
    </TouchableOpacity>
  );
}
