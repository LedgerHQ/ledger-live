import React, { useEffect, useState } from "react";
import { select } from "@storybook/addon-knobs";

import { storiesOf } from "../../storiesOf";
import { Flex, StepList, Text } from "../../../../src";

const StepListStory = () => {
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
    },
    {
      status: "inactive",
      title: "Recovery phrase",
      renderBody: () => (
        <Text>
          {`Your recovery phrase is a secret list of 24 words that backs up your private keys. Your Nano generates a unique recovery phrase. Ledger does not keep a copy of it.`}
        </Text>
      ),
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

  const animate = select("Animate", [true, false], true);
  const [items, setItems] = useState(defaultItems);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setTimeout(() => {
      if (!animate) {
        return;
      }
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
  }, [items, animate]);

  return (
    <Flex width={300}>
      <StepList items={items as any} />
    </Flex>
  );
};

storiesOf((story) => story("Layout/List", module).add("StepList", () => <StepListStory />));
