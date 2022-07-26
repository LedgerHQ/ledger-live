import React, { memo } from "react";
import { TouchableWithoutFeedback, View } from "react-native";
import styled from "styled-components/native";
import { Text } from "@ledgerhq/native-ui";

import ParentCurrencyIcon from "../../../components/ParentCurrencyIcon";
import { scrollToTop } from "../../../navigation/utils";
import useCurrency from "../../../helpers/useCurrency";

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
  const currency = useCurrency();

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
