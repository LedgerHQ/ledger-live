import React, { useMemo } from "react";
import { TouchableOpacity, Image } from "react-native";
import styled, { useTheme } from "styled-components/native";
import { Flex, Text, Icon } from "../../index";
import { highlight } from "../helper";
import ColoredGradient from "./ColoredGradient";
import ShadowGradient from "./ShadowGradient";

const ImageContent = styled(Image)`
  border-radius: 8px;
`;

type Props = {
  variant?: "purple" | "red";
  backgroundImage?: string;
  tag?: string;
  description?: string;
  onPress?: () => void;
  onDismiss?: () => void;
};

const FullBackgroundCard = ({
  variant,
  backgroundImage,
  tag,
  description,
  onPress,
  onDismiss,
}: Props): React.ReactElement => {
  const { colors } = useTheme();

  const backgroundVariants = useMemo(
    () => ({
      purple: colors.primary.c80,
      red: colors.error.c60,
    }),
    [colors.primary.c80, colors.error.c60],
  );

  const backgroundVariantColor =
    variant && backgroundVariants[variant]
      ? backgroundVariants[variant]
      : backgroundVariants.purple;

  return (
    <Flex borderRadius={8}>
      <TouchableOpacity activeOpacity={0.5} onPress={onPress}>
        {backgroundImage ? (
          <>
            <ImageContent
              source={{
                uri: backgroundImage,
              }}
              style={{ width: "100%", height: "100%", position: "absolute" }}
            />
            <ShadowGradient color={colors.neutral.c00} />
          </>
        ) : (
          <ColoredGradient color={backgroundVariantColor} opacityColor={colors.neutral.c20} />
        )}
        <Flex p={6}>
          <Flex flexDirection="row" justifyContent="space-between" mb={3}>
            <Flex bg="neutral.c100a01" borderRadius={6} px={3} py="6px" maxWidth="80%">
              <Text variant="small" fontWeight="semiBold" color="neutral.c90" numberOfLines={1}>
                {tag}
              </Text>
            </Flex>
            <TouchableOpacity onPress={onDismiss} style={{ top: -8, right: -8 }}>
              <Flex bg="neutral.c30" p="6px" borderRadius={24}>
                <Icon name="Close" size={12} color="neutral.c100" />
              </Flex>
            </TouchableOpacity>
          </Flex>
          {description ? (
            <Text
              variant="h4"
              fontWeight="semiBold"
              color="neutral.c100"
              numberOfLines={3}
              height="96px"
              lineHeight="32.4px"
            >
              {highlight(description, "h4")}
            </Text>
          ) : null}
        </Flex>
      </TouchableOpacity>
    </Flex>
  );
};

export default FullBackgroundCard;
