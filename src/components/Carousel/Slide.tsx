import React, { useCallback } from "react";
import { Linking, Image } from "react-native";
import { Flex, Text, Link as TextLink, Icons } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import Touchable from "../Touchable";
import { track } from "../../analytics";

type SlideProps = {
  url: string;
  name: string;
  title: string;
  description: any;
  cta: any;
  image: any;
  icon: any;
  position: any;
};

const Slide = ({
  url,
  name,
  title,
  description,
  cta,
  image,
  icon,
  position,
}: SlideProps) => {
  const { t } = useTranslation();
  const onClick = useCallback(() => {
    track("Portfolio Recommended OpenUrl", {
      url,
    });
    Linking.openURL(url);
  }, [url]);
  return (
    <Touchable event={`${name} Carousel`} onPress={onClick}>
      <Flex
        width={"350px"}
        height={"125px"}
        borderRadius={2}
        borderWidth={"1px"}
        borderColor={"neutral.c40"}
        justifyContent={"space-between"}
        flexDirection={"row"}
        p={6}
      >
        <Flex width={"200px"} alignItems="flex-start">
          <Text variant={"subtitle"} fontSize={11} color={"neutral.c60"}>
            {t(title)}
          </Text>
          <Text variant="paragraph" fontSize={14}>
            {t(description)}
          </Text>
          <Flex flex={1} />
          {cta ? (
            <TextLink
              type="color"
              Icon={Icons.ArrowRightMedium}
              iconPosition="right"
              onPress={onClick}
            >
              {t(cta)}
            </TextLink>
          ) : null}
        </Flex>
        <Flex justifyContent={"center"}>
          {image ? (
            <Image
              style={[{ position: "absolute" }, position]}
              source={image}
            />
          ) : icon ? (
            <Flex width={"110px"}>{icon}</Flex>
          ) : null}
        </Flex>
      </Flex>
    </Touchable>
  );
};

export default Slide;
