import React, { type ReactNode } from "react";
import { Pressable } from "react-native";
import { useTheme } from "styled-components/native";
import * as Icons from "@ledgerhq/icons-ui/native";
import { BannerIcon } from "../../Icon";
import { Flex } from "../../Layout";
import type { BaseStyledProps } from "../../styled";
import Text from "../../Text";

type Props = BaseStyledProps &
  Readonly<{
    title?: string;
    description: string;
    cta: ReactNode;
    icon: keyof typeof Icons;
    hasExternalLinkIcon?: boolean;
    unread?: boolean;
    onPress: () => void;
  }>;

export default function NewBannerCard({
  title,
  description,
  cta,
  icon,
  hasExternalLinkIcon,
  unread,
  onPress,
  p = 4,
  borderRadius = 12,
  ...styledProps
}: Props) {
  const { theme } = useTheme();

  return (
    <Pressable onPress={onPress} style={(p) => [{ opacity: p.pressed ? 0.2 : 1.0 }]}>
      <Flex
        flexDirection="row"
        alignItems="center"
        bg={theme === "dark" ? "opacityDefault.c05" : "background.default"}
        p={p}
        borderRadius={borderRadius}
        {...styledProps}
      >
        <Flex position="relative">
          <BannerIcon icon={icon} />
          {!!unread && (
            <Flex
              bg="error.c60"
              height={8}
              width={8}
              borderRadius={4}
              position="absolute"
              right={0}
              bottom={0}
            />
          )}
        </Flex>

        <Flex ml={5} flexShrink={1}>
          {title && (
            <Text color="neutral.c70" variant="subtitle">
              {title}
            </Text>
          )}

          <Text color="neutral.c100" variant="body" mt={2}>
            {description}
          </Text>

          <Flex mt={3} flexDirection="row" alignItems="center">
            <Text
              color="primary.c80"
              variant="paragraph"
              fontWeight="semiBold"
              pr={hasExternalLinkIcon ? 3 : 0}
            >
              {cta}
            </Text>
            {hasExternalLinkIcon && <Icons.ExternalLink size="S" color="primary.c80" />}
          </Flex>
        </Flex>
      </Flex>
    </Pressable>
  );
}
