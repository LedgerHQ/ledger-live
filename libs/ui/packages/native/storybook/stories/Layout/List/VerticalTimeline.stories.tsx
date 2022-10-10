import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { storiesOf } from "../../storiesOf";
import { Flex, VerticalTimeline, Text, Button, Switch, Divider } from "../../../../src";

const { ItemStatus } = VerticalTimeline;

const defaultItems = [
  {
    status: ItemStatus.active,
    title: "Nano paired",
  },
  {
    status: ItemStatus.inactive,
    title: "Set your PIN",
    estimatedTime: 120,
    renderBody: () => (
      <Text>
        {`Your PIN can be 4 to 8 digits long. Anyone with access to your Nano and to your PIN can also access all your crypto and NFT assets.`}
      </Text>
    ),
  },
  {
    status: ItemStatus.inactive,
    title: "Recovery phrase",
    estimatedTime: 300,
    renderBody: () => (
      <Text>
        {`Your recovery phrase is a secret list of 24 words that backs up your private keys. Your Nano generates a unique recovery phrase. Ledger does not keep a copy of it.`}
      </Text>
    ),
  },
  {
    status: ItemStatus.inactive,
    title: "Software check",
    renderBody: () => (
      <Text>{`We'll verify whether your Nano is genuine. This should be quick and easy!`}</Text>
    ),
  },
  {
    status: ItemStatus.inactive,
    title: "Nano is ready",
    renderBody: () => <DynamicHeightComponent />,
  },
];

const VerticalTimelineStory = () => {
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
      }, 1000);
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
        <VerticalTimeline steps={items} setActiveIndex={animate ? undefined : setActiveIndex} />
      </ScrollView>
    </Flex>
  );
};

const DynamicHeightComponent = () => {
  const [height, setHeight] = useState(100);
  return (
    <View>
      <Button
        type="main"
        onPress={() => {
          setHeight(Math.random() * 300);
        }}
      >
        set random size
      </Button>
      <View style={{ backgroundColor: "lightgreen", width: "100%", height }} />
    </View>
  );
};

storiesOf((story) =>
  story("Layout/List", module).add("VerticalTimeline", () => <VerticalTimelineStory />),
);
