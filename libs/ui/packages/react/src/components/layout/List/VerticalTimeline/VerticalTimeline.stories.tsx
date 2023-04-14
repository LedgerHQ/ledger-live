import React, { useEffect, useMemo, useState } from "react";
import Flex from "../../Flex";
import { Switch } from "../../../form";
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

const defaultItems = [
  {
    status: "active",
    title: "Nano paired",
  },
  {
    status: "inactive",
    title: "Set your PIN",
    renderBody: () => (
      <VerticalTimeline.BodyText>
        {`Your PIN can be 4 to 8 digits long. Anyone with access to your Nano and to your PIN can also access all your crypto and NFT assets.`}
      </VerticalTimeline.BodyText>
    ),
    estimatedTime: 120,
  },
  {
    status: "inactive",
    title: "Recovery phrase",
    renderBody: () => (
      <VerticalTimeline.BodyText>
        {`Your recovery phrase is a secret list of 24 words that backs up your private keys. Your Nano generates a unique recovery phrase. Ledger does not keep a copy of it.`}
      </VerticalTimeline.BodyText>
    ),
    estimatedTime: 300,
  },
  {
    status: "inactive",
    title: "Software check",
    renderBody: () => (
      <VerticalTimeline.BodyText>{`We'll verify whether your Nano is genuine. This should be quick and easy!`}</VerticalTimeline.BodyText>
    ),
  },
  {
    status: "inactive",
    title: "Nano is ready",
  },
];

const Template = () => {
  const [autoAnimate, setAutoAnimate] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(1);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    if (autoAnimate) {
      timeout = setTimeout(() => {
        if (currentIndex === defaultItems.length) {
          setCurrentIndex(0);
          return;
        }
        setCurrentIndex(currentIndex + 1);
      }, 1000);
    }
    return () => {
      timeout && clearTimeout(timeout);
    };
  }, [autoAnimate, currentIndex]);

  const items = useMemo(
    () =>
      defaultItems.map((item, index) => ({
        ...item,
        status: index < currentIndex ? "completed" : index > currentIndex ? "inactive" : "active",
      })),
    [currentIndex],
  );

  return (
    <Flex flexDirection="column" flex={1} alignItems="center">
      <Switch
        name="Auto animate"
        label="Auto animate steps"
        checked={autoAnimate}
        onChange={() => setAutoAnimate(!autoAnimate)}
      />

      <Flex width={300} mt={10}>
        <VerticalTimeline steps={items} onClickIndex={(index) => setCurrentIndex(index)} />
      </Flex>
    </Flex>
  );
};

export const Default = Template.bind({});
