import React from "react";

import Radio from "./index";
import Text from "@components/asorted/Text";
import type { RadioElementProps } from "./RadioElement";
import Flex from "@components/layout/Flex";

export default {
  title: "Form/Radio",
};

const Template = () => {
  const sections: Array<{ title: NonNullable<RadioElementProps["variant"]> }> = [
    { title: "default" },
    { title: "success" },
    { title: "error" },
  ];

  return sections.map(({ title }) => (
    <Flex mb="3rem" rowGap="1rem" flexDirection="column">
      <Text type="h2" textTransform="uppercase">
        {title}
      </Text>
      <Radio currentValue="third" onChange={() => {}} name={title}>
        <Radio.Element label="unselected" value="first" variant={title} />
        <Radio.Element label="selected" value="third" variant={title} />
        <Radio.Element label="disabled" value="two" variant={title} disabled />
      </Radio>
    </Flex>
  ));
};

export const RadioElement = Template.bind({});
