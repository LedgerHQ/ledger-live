import React from "react";
import { TouchableOpacity } from "react-native";
import { Flex, Icons, InfiniteLoader, Text } from "@ledgerhq/native-ui";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/live-common/types/index";
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
    <Flex width={32} height={32} justifyContent="center">
      <InfiniteLoader size={24} />
    </Flex>
  );

  return (
    <TouchableOpacity onPress={onPress} disabled={disabled}>
      <Flex
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        paddingY={4}
      >
        <Flex flexDirection="row" alignItems="center">
          <Flex alignItems="center" justifyContent="center">
            {Icon}
          </Flex>

          <Flex marginLeft={4} marginRight={4}>
            <Text variant="h3" marginBottom={2}>
              {title ?? t("transfer.swap2.form.loading")}
            </Text>
            <Text variant="subtitle">{subTitle}</Text>
          </Flex>
        </Flex>

        <Icons.ChevronBottomRegular />
      </Flex>
    </TouchableOpacity>
  );
}
