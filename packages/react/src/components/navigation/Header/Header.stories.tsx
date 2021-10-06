import Icon from "@ui/components/asorted/Icon";
import Text from "@ui/components/asorted/Text";
import FlexBox from "@ui/components/layout/Flex";
import React from "react";
import HeaderComponent, { Props } from "./index";

export default {
  title: "Navigation/Header",
  component: HeaderComponent,
};

export const Header = (args: Props): JSX.Element => {
  const left = (
    <FlexBox alignItems="center" style={{ columnGap: "6px" }}>
      <Icon name="ArrowLeft" weight="Medium" />
      <Text ff="Inter|SemiBold" fontSize={3}>
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
      <Text bracket ff="Alpha|Medium" textTransform="uppercase">
        Ledger
      </Text>
    </HeaderComponent>
  );
};
