import React from "react";
import useUpsellFlexModel from "./useUpsellFlexModel";
import {
  Box,
  Button,
  Flex,
  IconBoxList,
  Icons,
  ScrollListContainer,
  Text,
} from "@ledgerhq/native-ui";
import { TouchableOpacity } from "react-native";
import styled from "styled-components/native";
import videoSources from "../../../../../../assets/videos";
import Video from "react-native-video";
import GradientContainer from "~/components/GradientContainer";
import { TrackScreen } from "~/analytics";

const videoSource = videoSources.flex;

const hitSlop = {
  bottom: 10,
  left: 24,
  right: 24,
  top: 10,
};

const StyledSafeAreaView = styled(Box)`
  flex: 1;
  background-color: ${p => p.theme.colors.background.default};
  padding-top: ${p => p.theme.space[10]}px;
`;

const CloseButton = styled(TouchableOpacity)`
  background-color: ${p => p.theme.colors.neutral.c30};
  padding: 8px;
  border-radius: 32px;
`;

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

type ViewProps = ReturnType<typeof useUpsellFlexModel>;

function View({
  t,
  handleBack,
  setupDevice,
  buyLedger,
  colors,
  readOnlyModeEnabled,
  videoMounted,
}: ViewProps) {
  return (
    <StyledSafeAreaView>
      {readOnlyModeEnabled ? <TrackScreen category="ReadOnly" name="Upsell Flex" /> : null}
      <Flex
        flexDirection="row"
        alignItems="center"
        justifyContent="flex-end"
        width="100%"
        position="absolute"
        zIndex={10}
        p={6}
        top={50}
      >
        <CloseButton onPress={handleBack} hitSlop={hitSlop}>
          <Icons.Close size="S" />
        </CloseButton>
      </Flex>
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
    </StyledSafeAreaView>
  );
}

const UpsellFlex = () => <View {...useUpsellFlexModel()} />;

export default UpsellFlex;
