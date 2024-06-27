import React from "react";
import Flex from "../../Flex";
import { Text, Divider } from "../../../asorted";
import type { Item } from ".";
import NumberedList from ".";
import { useTheme } from "styled-components";
const description = `
### A NumberedList List

This components accepts an Array of object like this:
## Usage

\`\`\`js

const steps = [
    {
      /**
       * title is the title of the step
       */
      title: string;
    },
  ];

<NumberedList steps={steps} />
\`\`\`
`;

export default {
  title: "Layout/List/NumberedList",
  argTypes: {
    steps: {
      control: "disabled",
    },
  },
  parameters: {
    docs: {
      description: {
        component: description,
      },
    },
  },
};

const defaultItems: Item[] = [
  {
    element: "General information",
  },
  {
    element: (
      <Text fontSize={14} variant="body" color={"error.c40"} ml="12px" fontWeight="500">
        {"General information"}
      </Text>
    ),
  },
  {
    element: "General information",
  },
  {
    element: (
      <Text fontSize={14} variant="body" color={"primary.c80"} ml="12px" fontWeight="500">
        {"General information"}
      </Text>
    ),
  },
  {
    element: "General information",
  },
];

const defaultItemsWithNothing: Item[] = [
  {
    element: "General information",
  },
  {
    element: "General information",
  },
  {
    element: (
      <Text fontSize={14} variant="body" color={"error.c50"} ml="12px" fontWeight="500">
        {"General information"}
      </Text>
    ),
  },
];

const Template = () => {
  const { colors } = useTheme();
  return (
    <Flex
      flexDirection="column"
      height={500}
      rowGap="40px"
      alignItems="center"
      justifyContent="center"
      bg="neutral.c30"
    >
      <NumberedList steps={defaultItems} />
      <Divider my={1} text="Customized List" />
      <NumberedList
        steps={defaultItemsWithNothing}
        bgIndexColor={colors.success.c60}
        indexColor={colors.constant.black}
        textColor={"primary.c60"}
      />
    </Flex>
  );
};

export const Default = Template.bind({});
