import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { Flex, Text } from "@ledgerhq/native-ui";
import React from "react";
import CircleCurrencyIcon from "~/components/CircleCurrencyIcon";

type StickyHeaderProps = {
  currencyId?: string;
};

export const Ticker: React.FC<StickyHeaderProps> = ({ currencyId = "bitcoin" }) => {
  const currency = getCryptoCurrencyById(currencyId);

  return (
    <Flex
      flexDirection="row"
      alignItems="center"
      backgroundColor="opacityDefault.c10"
      padding={3}
      borderRadius={40}
    >
      <Flex paddingLeft={2}>
        <CircleCurrencyIcon currency={currency} size={28} sizeRatio={0.9} />
      </Flex>
      <Text
        color="neutral.c100"
        fontWeight="bold"
        textTransform="uppercase"
        marginLeft={3}
        fontSize={16}
        paddingRight={2}
      >
        {currency.explorerId}
      </Text>
    </Flex>
  );
};
