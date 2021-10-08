import React from "react";
import Text from "@components/asorted/Text";
import FlexBox from "@components/layout/Flex";
import { LifeRingMedium } from "@assets/icons";
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
  const header = (
    <Text ff="Alpha|Medium" fontSize={7} textAlign="center" bracket>
      Header
    </Text>
  );

  const footer = (
    <FlexBox flexDirection="column" rowGap={3}>
      <FlexBox columnGap={3} alignItems="center">
        <Text ff="Inter|Medium" fontSize={4}>
          Need help?
        </Text>
        <LifeRingMedium size={20} />
      </FlexBox>
      <Text ff="Inter|Medium" fontSize={3}>
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
        backgroundColor="palette.primary.c60"
      >
        <FlexBox m={-10}>
          <img src={nanoIllustration} />
        </FlexBox>
      </AsideComponent>
      <AsideComponent
        {...args}
        header={header}
        p={10}
        backgroundColor="palette.primary.c60"
        flex={1}
      >
        <FlexBox justifyContent="center">
          <img src={keyboardIllustration} />
        </FlexBox>
      </AsideComponent>
    </FlexBox>
  );
}
