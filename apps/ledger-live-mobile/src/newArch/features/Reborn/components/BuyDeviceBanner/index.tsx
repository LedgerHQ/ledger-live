import React from "react";
import useBuyDeviceBannerModel, { Props } from "./useBuyDeviceBannerModel";
import { Flex, Text, Icons } from "@ledgerhq/native-ui";
import GradientContainer from "~/components/GradientContainer";
import { useTranslation } from "react-i18next";
import ForceTheme from "~/components/theme/ForceTheme";
import { Image } from "react-native";
import Button from "~/components/wrappedUi/Button";

type ViewProps = ReturnType<typeof useBuyDeviceBannerModel>;

export const IMAGE_PROPS_BUY_DEVICE_FLEX = {
  imageScale: 1,
  imageStyle: {
    height: 180,
    right: -70,
    bottom: 10,
  },
};

export const IMAGE_PROPS_BUY_DEVICE_FLEX_BOX = {
  imageStyle: {
    height: 120,
    right: -70,
    bottom: -1,
  },
};

export const IMAGE_PROPS_POST_PURCHASHE = {
  imageStyle: {
    height: 110,
    right: -130,
    bottom: -1,
  },
};

function View({
  topLeft,
  buttonLabel,
  buttonSize,
  event,
  imageSource,
  imageStyle,
  revertTheme,
  colors,
  variant,
  eventProperties,
  onPress,
  pressMessage,
}: ViewProps) {
  const { t } = useTranslation();

  const RightIcon = <Icons.ArrowRight />;

  return (
    <Flex m={16}>
      <Flex borderRadius={16}>
        <GradientContainer
          direction="left-to-right"
          containerStyle={{
            overflow: variant === "setup" ? "hidden" : "visible",
            zIndex: 1,
            borderRadius: 16,
          }}
          gradientStyle={{ flex: 1, overflow: "hidden" }}
          color={colors.opacityDefault.c30}
          endOpacity={90}
          borderRadius={16}
        >
          <Flex padding={16}>
            <Flex flexDirection="column" alignItems="flex-start" width={"60%"}>
              {topLeft || (
                <>
                  <Text variant="h5" fontWeight="semiBold" color="neutral.c00" mb={3}>
                    {t("buyDevice.bannerTitle")}
                  </Text>
                  <Text variant="paragraph" fontWeight="medium" color="neutral.c00" mb="20px">
                    {t("buyDevice.bannerSubtitle")}
                  </Text>
                </>
              )}
              <ForceTheme selectedPalette={revertTheme}>
                <Button
                  onPress={onPress}
                  size={buttonSize}
                  event={variant === "setup" ? undefined : event}
                  eventProperties={variant === "setup" ? undefined : eventProperties}
                  type="main"
                  flexShrink={0}
                >
                  {buttonLabel ?? t("buyDevice.bannerButtonTitle")}
                </Button>
              </ForceTheme>
            </Flex>
            <Flex position="absolute" right={0} bottom={0} pointerEvents="none" zIndex={2}>
              <Image
                resizeMode="contain"
                resizeMethod="resize"
                style={imageStyle}
                source={imageSource}
              />
            </Flex>
          </Flex>
        </GradientContainer>
      </Flex>
      {variant !== "setup" && (
        <Flex mt={24}>
          <Button
            type="shade"
            outline
            Icon={RightIcon}
            isNewIcon
            iconPosition="right"
            onPress={pressMessage}
          >
            {t("buyDevice.setupCta")}
          </Button>
        </Flex>
      )}
    </Flex>
  );
}

const BuyDeviceBanner = (props: Props) => {
  return <View {...useBuyDeviceBannerModel(props)} />;
};

export default BuyDeviceBanner;
