import React from "react";

import Text from "../../asorted/Text";
import Flex from "../../layout/Flex";
import Radio from "./index";
import type { RadioElementProps } from "./RadioElement";

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
    <Flex mb="3rem" rowGap="1rem" flexDirection="column" key={title}>
      <Text variant="h2" textTransform="uppercase">
        {title}
      </Text>
      <Radio currentValue="third" onChange={() => {}} name={title}>
        <Radio.Element label="unselected" value="first" variant={title} />
        <Radio.Element label="selected" value="third" variant={title} />
        <Radio.Element label="disabled" value="two" variant={title} disabled />
        <Radio.Element label="selected and disabled" value="two" variant={title} disabled checked />
      </Radio>
    </Flex>
  ));
};

export const RadioElement = Template.bind({});
