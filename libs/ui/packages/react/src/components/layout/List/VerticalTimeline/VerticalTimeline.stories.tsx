import React, { useEffect, useState } from "react";
import Flex from "../../Flex";
import Text from "../../../asorted/Text";
import VerticalTimeline from ".";

const description = `
### A Vertical Timeline

This components accepts an Array of object like this:
## Usage

\`\`\`js

const steps = [
    {
      /**
       * status is an ItemStatus which can be inactive, active or completed
       */
      status: ItemStatus;
      /**
       * title is the title of the step
       */
      title: string;
      /**
       * renderBody is an optional prop which is a ReactNode to be rendered next to the title
       */
      renderBody?: (isDisplayed?: boolean) => ReactNode;
      /**
       * estimatedTime is an optional prop that take the estimated time to complete the time in second and display it in a tag in minute
       */
       estimatedTime?: number;
    },
    {  
      status: ItemStatus;
      title: string;
      renderBody?: (isDisplayed?: boolean) => ReactNode;
      estimatedTime?: number;
    }
  ];

<VerticalTimeline steps={steps as any} />
\`\`\`
`;

export default {
  title: "Layout/List/VerticalTimeline",
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

const Template = () => {
  const defaultItems = [
    {
      status: "active",
      title: "Nano paired",
    },
    {
      status: "inactive",
      title: "Set your PIN",
      renderBody: () => (
        <Text>
          {`Your PIN can be 4 to 8 digits long. Anyone with access to your Nano and to your PIN can also access all your crypto and NFT assets.`}
        </Text>
      ),
      estimatedTime: 120,
    },
    {
      status: "inactive",
      title: "Recovery phrase",
      renderBody: () => (
        <Text>
          {`Your recovery phrase is a secret list of 24 words that backs up your private keys. Your Nano generates a unique recovery phrase. Ledger does not keep a copy of it.`}
        </Text>
      ),
      estimatedTime: 300,
    },
    {
      status: "inactive",
      title: "Software check",
      renderBody: () => (
        <Text>{`We'll verify whether your Nano is genuine. This should be quick and easy!`}</Text>
      ),
    },
    {
      status: "inactive",
      title: "Nano is ready",
    },
  ];

  const [items, setItems] = useState(defaultItems);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setTimeout(() => {
      if (currentIndex === defaultItems.length) {
        setCurrentIndex(0);
        setItems(defaultItems);
        return;
      }
      const newItems = items.concat([]);
      newItems[currentIndex]["status"] = "completed";
      if (currentIndex + 1 !== defaultItems.length) {
        newItems[currentIndex + 1]["status"] = "active";
      }
      setCurrentIndex(currentIndex + 1);
      setItems(newItems);
    }, 1000);
  }, [items, currentIndex]);

  return (
    <Flex width={300}>
      <VerticalTimeline steps={items as any} />
    </Flex>
  );
};

export const Default = Template.bind({});
