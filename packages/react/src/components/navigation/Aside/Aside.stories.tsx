import React from "react";

import Text from "../../asorted/Text";
import FlexBox from "../../layout/Flex";
import Log from "../../message/Log";
import { LifeRingMedium } from "@ledgerhq/icons-ui/react";
import AsideComponent, { Props } from "./index";
import { nanoIllustration, keyboardIllustration } from "./stories.helper";

export default {
  title: "Navigation/Aside",
  component: AsideComponent,
  argTypes: {
    header: { control: false },
    footer: { control: false },
    theme: { table: { disable: true } },
    as: { table: { disable: true } },
    forwardedAs: { table: { disable: true } },
  },
};

export function Aside(args: Props): JSX.Element {
  const header = <Log>Header</Log>;

  const footer = (
    <FlexBox flexDirection="column" rowGap={3}>
      <FlexBox columnGap={3} alignItems="center">
        <Text fontWeight="medium" variant={"body"}>
          Need help?
        </Text>
        <LifeRingMedium size={20} />
      </FlexBox>
      <Text fontWeight="medium" variant={"paragraph"}>
        Don’t know what you have to do? Get some help to close this step.
      </Text>
      <div></div>
    </FlexBox>
  );

  return (
    <FlexBox columnGap={4}>
      <AsideComponent
        {...args}
        header={header}
        footer={footer}
        p={10}
        width="324px"
        backgroundColor="primary.c60"
      >
        <FlexBox m={-10}>
          <img src={nanoIllustration} />
        </FlexBox>
      </AsideComponent>
      <AsideComponent {...args} header={header} p={10} backgroundColor="primary.c60" flex={1}>
        <FlexBox justifyContent="center">
          <img src={keyboardIllustration} />
        </FlexBox>
      </AsideComponent>
    </FlexBox>
  );
}
