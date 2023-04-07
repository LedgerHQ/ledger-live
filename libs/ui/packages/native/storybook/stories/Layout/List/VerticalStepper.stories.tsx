import React, { useCallback, useEffect, useState } from "react";
import { ScrollView } from "react-native";
import { Flex, VerticalStepper, Text, Switch, Divider } from "../../../../src/components";

const { ItemStatus } = VerticalStepper;

const restoreSteps = [
  {
    status: ItemStatus.completed,
    title: "Restoring language",
  },
  {
    status: ItemStatus.active,
    title: "Restoring lock screen picture",
  },
  {
    status: ItemStatus.inactive,
    title: "Installing apps",
  },
];

const defaultItems = [
  {
    status: ItemStatus.active,
    title: "Prepare update",
    renderBody: () => (
      <Text color="neutral.c80">
        {`Backing up your configuration and transferring the update to your device.`}
      </Text>
    ),
  },
  {
    status: ItemStatus.inactive,
    title: "Install update",
    progress: 0.5,
    renderBody: () => (
      <Text color="neutral.c80">
        {`Your device will restart multiple times. Stay in the Ledger Live app.`}
      </Text>
    ),
  },
  {
    status: ItemStatus.inactive,
    title: "Restore apps and settings",
    renderBody: () => (
      <Flex>
        <Text color="neutral.c80">
          {`Restore your previous apps, settings, language and lockscreen picture.`}
        </Text>
        <VerticalStepper nested steps={restoreSteps} />
      </Flex>
    ),
  },
];

export const VerticalStepperStory = () => {
  const [items, setItems] = useState(defaultItems);
  const [animate, setAnimate] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const setActiveIndex = useCallback((newIndex: number) => {
    const newItems = defaultItems.map((item, index) => {
      if (index < newIndex) return { ...item, status: ItemStatus.completed };
      else if (index === newIndex) return { ...item, status: ItemStatus.active };
      else return { ...item, status: ItemStatus.inactive };
    });
    setCurrentIndex(newIndex);
    setItems(newItems);
  }, []);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (animate) {
      timeout = setTimeout(() => {
        if (!animate) {
          return;
        }
        if (currentIndex === defaultItems.length) {
          setActiveIndex(0);
        } else {
          setActiveIndex(currentIndex + 1);
        }
      }, 2500);
    }
    return () => {
      timeout && clearTimeout(timeout);
    };
    // eslint-disable-next-line
  }, [animate, currentIndex]);

  return (
    <Flex width={"100%"} px={30} flex={1}>
      <ScrollView>
        <Switch checked={animate} onChange={setAnimate} label={"Auto animate VerticalTimeline"} />
        <Divider />
        <VerticalStepper steps={items} setActiveIndex={animate ? undefined : setActiveIndex} />
      </ScrollView>
    </Flex>
  );
};
VerticalStepperStory.storyName = "VerticalStepper";
