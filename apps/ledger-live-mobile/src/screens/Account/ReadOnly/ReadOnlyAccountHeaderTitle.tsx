import React, { memo, useMemo } from "react";
import { TouchableWithoutFeedback, View } from "react-native";
import { useRoute } from "@react-navigation/native";
import styled from "styled-components/native";
import {
  getCryptoCurrencyById,
  getTokenById,
} from "@ledgerhq/live-common/lib/currencies";
import { Text } from "@ledgerhq/native-ui";

import ParentCurrencyIcon from "../../../components/ParentCurrencyIcon";
import { scrollToTop } from "../../../navigation/utils";

const HeaderContainer = styled(View)`
  flex-direction: row;
  align-items: center;
  margin-left: 32px;
  margin-right: 32px;
  padding-top: 5px;
  padding-bottom: 5px;
`;

const IconContainer = styled(View)`
  margin-right: 8px;
  justify-content: center;
`;

function AccountHeaderTitle() {
  const route: any = useRoute();
  const { currencyId, currencyType } = route.params;
  const currency = useMemo(
    () =>
      currencyType === "CryptoCurrency"
        ? getCryptoCurrencyById(currencyId)
        : getTokenById(currencyId),
    [currencyType, currencyId],
  );

  if (!currency) return null;

  return (
    <TouchableWithoutFeedback onPress={scrollToTop}>
      <HeaderContainer>
        <IconContainer>
          <ParentCurrencyIcon size={32} currency={currency} />
        </IconContainer>
        <Text variant={"body"} fontWeight={"semiBold"} numberOfLines={1} pr={8}>
          {currency.name}
        </Text>
      </HeaderContainer>
    </TouchableWithoutFeedback>
  );
}

export default memo(AccountHeaderTitle);
