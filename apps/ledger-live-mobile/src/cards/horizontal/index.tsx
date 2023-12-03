import { Flex, Icons, Text } from "@ledgerhq/native-ui";
import { ComponentProps } from "react";
import { Image, TouchableOpacity } from "react-native";
import { useTheme } from "styled-components/native";
import { CarouselItemMetadata } from "~/cards/types";

type ButtonAction = ComponentProps<typeof TouchableOpacity>["onPress"];

type Props = {
  title: string;
  subtitle: string;

  //
  image?: string;

  //
  tag?: string;
} & CarouselItemMetadata;

type ImageComponentProps = {
  uri: string;
};

/**
 *
 */
const ImageComponent = ({ uri }: ImageComponentProps) => {
  return (
    <Flex width={40} height={40}>
      <Image source={{ uri }} borderRadius={9999} style={{ width: "100%", height: "100%" }} />
    </Flex>
  );
};

type CloseComponentProps = {
  onPress: ButtonAction;
};

/**
 *
 */
const CloseComponent = ({ onPress }: CloseComponentProps) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <Icons.Close size="XS" />
    </TouchableOpacity>
  );
};

/**
 *
 */
type TagComponentProps = {
  label: string;
};
const TagComponent = ({ label }: TagComponentProps) => {
  const { colors } = useTheme();

  return (
    <Flex bg={colors.primary.c80} borderRadius={"4px"} height={"18px"} justifyContent="center">
      <Text variant="small" fontWeight="bold" px={"6px"} color={colors.neutral.c00}>
        {label}
      </Text>
    </Flex>
  );
};

/**
 *
 */
const TitleComponent = ({ label }: TagComponentProps) => {
  return (
    <Text variant="body" fontWeight="medium" numberOfLines={1}>
      {label}
    </Text>
  );
};

/**
 *
 */
const SubtitleComponent = ({ label }: TagComponentProps) => {
  const { colors } = useTheme();

  return (
    <Text variant="paragraph" fontWeight="medium" color={colors.neutral.c70}>
      {label}
    </Text>
  );
};

/**
 *
 */
const HorizontalCard = ({ title, subtitle, image, tag, metadata }: Props) => {
  const { colors, space } = useTheme();

  const isDismissable = !!metadata.onDismiss;
  const isTag = !!tag;

  return (
    <TouchableOpacity onPress={metadata.onClick}>
      <Flex
        bg={colors.opacityDefault.c05}
        p="13px"
        borderRadius="12px"
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        columnGap={13}
      >
        {image && <ImageComponent uri={image} />}

        <Flex flexGrow={1} rowGap={space[2]}>
          <Flex flexDirection="row" justifyContent="space-between" columnGap={space[3]}>
            <Flex overflow={"hidden"} flex={1}>
              <TitleComponent label={title} />
            </Flex>

            <Flex alignSelf="center" height="16px">
              {isDismissable ? (
                <CloseComponent onPress={metadata.onDismiss} />
              ) : (
                isTag && <TagComponent label={tag} />
              )}
            </Flex>
          </Flex>

          <SubtitleComponent label={subtitle} />
        </Flex>
      </Flex>
    </TouchableOpacity>
  );
};

export default HorizontalCard;
