import React from "react";
import { Button, Flex, IconBoxList, Icons, ScrollListContainer, Text } from "@ledgerhq/native-ui";

import videoSources from "../../../../../../assets/videos";
import Video from "react-native-video";
import GradientContainer from "~/components/GradientContainer";
import useBuyDeviceViewModel from "./useBuyDeviceViewModel";

const videoSource = videoSources.flex;

const items = [
  {
    title: "buyDevice.0.title",
    desc: "buyDevice.0.desc",
    Icon: Icons.Coins,
  },
  {
    title: "buyDevice.1.title",
    desc: "buyDevice.1.desc",
    Icon: Icons.GraphAsc,
  },
  {
    title: "buyDevice.2.title",
    desc: "buyDevice.2.desc",
    Icon: Icons.Globe,
  },
  {
    title: "buyDevice.3.title",
    desc: "buyDevice.3.desc",
    Icon: Icons.Flex,
  },
];

const videoStyle = {
  height: "100%",
};

type ViewProps = ReturnType<typeof useBuyDeviceViewModel>;

function View({ t, setupDevice, buyLedger, colors, videoMounted }: Readonly<ViewProps>) {
  return (
    <>
      <ScrollListContainer>
        <Flex
          height={320}
          borderTopLeftRadius={32}
          borderTopRightRadius={32}
          width="100%"
          overflow="hidden"
          opacity={videoMounted ? 0.8 : 0}
        >
          {videoMounted && (
            <Video
              disableFocus
              source={videoSource}
              style={{
                backgroundColor: colors.background.main,
                transform: [{ scale: 1.4 }],
                ...(videoStyle as object),
              }}
              muted
              repeat={true}
            />
          )}
          <GradientContainer
            color={colors.background.drawer}
            startOpacity={0}
            endOpacity={1}
            direction="top-to-bottom"
            containerStyle={{
              position: "absolute",
              borderRadius: 0,
              left: 0,
              bottom: 0,
              width: "100%",
              height: "30%",
            }}
          />
        </Flex>
        <Flex p={6}>
          <Text variant="h4" textAlign="center" lineHeight="32.4px">
            {t("buyDevice.title")}
          </Text>
          <Flex mt={6} mb={8} justifyContent="center" alignItems="stretch">
            <Text px={6} textAlign="center" variant="body" color="neutral.c70">
              {t("buyDevice.desc")}
            </Text>
          </Flex>
          <IconBoxList
            iconShapes="circle"
            itemContainerProps={{ pr: 6 }}
            items={items.map(item => ({
              Icon: <item.Icon size="S" />,
              title: t(item.title),
              description: (
                <Text variant="paragraphLineHeight" color="neutral.c70">
                  {t(item.desc)}
                </Text>
              ),
            }))}
          />
        </Flex>
      </ScrollListContainer>
      <Flex>
        <Button
          mx={6}
          my={6}
          type="main"
          outline={false}
          testID="getDevice-buy-button"
          onPress={buyLedger}
          size="large"
        >
          {t("buyDevice.cta")}
        </Button>
        <Flex px={6} pt={0} mb={8}>
          <Button
            type="default"
            border={1}
            borderColor="neutral.c50"
            onPress={setupDevice}
            size="large"
          >
            {t("buyDevice.footer")}
          </Button>
        </Flex>
      </Flex>
    </>
  );
}

const BuyDeviceView = () => <View {...useBuyDeviceViewModel()} />;

export default BuyDeviceView;
