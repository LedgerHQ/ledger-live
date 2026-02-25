import HeaderComponent, { Props } from "./index";

import Icon from "../../asorted/Icon";
import Text from "../../asorted/Text";
import FlexBox from "../../layout/Flex";
import React from "react";

export default {
  title: "Navigation/Header",
  component: HeaderComponent,
};

export const Header = (args: Props): JSX.Element => {
  const left = (
    <FlexBox alignItems="center" style={{ columnGap: "6px" }}>
      <Icon name="ArrowLeft" weight="Medium" />
      <Text fontWeight="semiBold" variant={"paragraph"}>
        Previous
      </Text>
    </FlexBox>
  );

  const right = (
    <FlexBox alignItems="center" style={{ columnGap: "8px" }}>
      <Icon name="Linux" size={20} />
      <Icon name="Apple" size={20} />
      <Icon name="Windows" size={20} />
    </FlexBox>
  );

  return (
    <HeaderComponent {...args} left={left} right={right} alignItems="center">
      <Text variant={"h3"} textTransform="uppercase">
        Ledger
      </Text>
    </HeaderComponent>
  );
};
