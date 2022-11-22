import React, { useMemo } from "react";
import { TouchableOpacity } from "react-native-gesture-handler";
import { useTheme } from "styled-components/native";
import { Flex, Text, Icon } from "../../index";
import BackgroundGradient from "./Gradient";

function highlight(text: string) {
  const textSplitted = text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .split(/<bold>(.*?)<\/bold>/g);
  const elems = [];
  for (let i = 0; i < textSplitted.length; i += 1) {
    if (i % 2 !== 0) {
      const word = textSplitted[i].replace(/<bold>(.*?)<\/bold>/g, "$1");
      elems.push(
        <Text key={"highlighted_" + i} variant="h4" fontWeight="semiBold" color="primary.c80">
          {word}
        </Text>,
      );
    } else {
      elems.push(textSplitted[i]);
    }
  }
  return elems;
}

type Props = {
  variant?: "purple" | "red";
  tag?: string;
  description?: string;
};

const CardA = ({ variant, tag, description }: Props): React.ReactElement => {
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
      <TouchableOpacity activeOpacity={0.5}>
        <BackgroundGradient
          color={backgroundVariantColor}
          opacityColor={colors.neutral.c20}
          style={{ borderRadius: 8 }}
        />
        <Flex p={6}>
          <Flex flexDirection="row" justifyContent="space-between" mb={3}>
            <Flex bg="neutral.c100a01" borderRadius={6} px={3} py="6px" maxWidth="80%">
              <Text variant="small" fontWeight="semiBold" color="neutral.c90" numberOfLines={1}>
                {tag}
              </Text>
            </Flex>
            <TouchableOpacity>
              <Flex bg="neutral.c30" top={-8} right={-8} p="6px" borderRadius={24}>
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
              height="84px"
              lineHeight="28px"
            >
              {highlight(description)}
            </Text>
          ) : null}
        </Flex>
      </TouchableOpacity>
    </Flex>
  );
};

export default CardA;
