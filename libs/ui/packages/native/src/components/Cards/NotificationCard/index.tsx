import React, { useMemo } from "react";
import { ExternalLinkMedium } from "@ledgerhq/icons-ui/native";
import Text from "../../Text";
import Flex from "../../Layout/Flex";
import Box from "../../Layout/Box";
import Link from "../../cta/Link";
import styled from "styled-components/native";
import { TouchableOpacityProps, TouchableOpacity } from "react-native";

export type CardProps = TouchableOpacityProps & {
  tag?: string;
  description?: string;
  cta?: string;
  link?: string;
  time?: string;
  title?: string;
  onClickCard?: () => void;
  showLinkCta: boolean;
  viewed: boolean;
};

const Tag = ({ tag }: { tag: string }) => (
  <Flex bg="neutral.c100a01" borderRadius={6} px={3} py="3px" maxWidth="75%">
    <Text variant="small" fontWeight="semiBold" color="neutral.c90" numberOfLines={1}>
      {tag}
    </Text>
  </Flex>
);

const Timer = ({ time, viewed }: { time: string; viewed: boolean }) => (
  <Flex flexDirection="row" justifyContent="space-between" alignItems="center" ml={2}>
    <Text variant="small" fontWeight="semiBold" color="neutral.c90" numberOfLines={1}>
      {time}
    </Text>

    <Box
      ml={3}
      backgroundColor={viewed ? "transparent" : "error.c80"}
      height="8px"
      width="8px"
      borderRadius={24}
    />
  </Flex>
);

const NotificationCard = (props: CardProps): React.ReactElement => {
  const {
    tag = "",
    time = "",
    title,
    description,
    cta,
    viewed,
    onClickCard,
    showLinkCta,
    link = "",
  } = props;

  const ctaIcon = useMemo(() => {
    const isDeepLink = link?.startsWith("ledgerlive:");

    return link && isDeepLink ? undefined : () => <ExternalLinkMedium color="neutral.c100" />;
  }, [link]);

  return (
    <Base onPress={onClickCard} activeOpacity={link ? 0.5 : 1}>
      <Flex width="100%" flexDirection="column">
        <Flex flexDirection="row" justifyContent="space-between">
          <Tag tag={tag} />
          <Timer time={time} viewed={viewed} />
        </Flex>

        <Text variant="large" fontWeight="semiBold" color="neutral.c100" numberOfLines={1} mt={4}>
          {title}
        </Text>

        <Text
          variant="bodyLineHeight"
          fontWeight="medium"
          color="neutral.c70"
          numberOfLines={3}
          mt={2}
          mb={showLinkCta ? 4 : 0}
        >
          {description}
        </Text>

        {!!showLinkCta && (
          <Flex alignItems="flex-start">
            <Link
              type="main"
              size="medium"
              iconPosition="right"
              Icon={ctaIcon}
              onPress={onClickCard}
              numberOfLines={1}
            >
              <StyledText
                variant="bodyLineHeight"
                fontWeight="semiBold"
                color="neutral.c100"
                numberOfLines={1}
              >
                {cta}
              </StyledText>
            </Link>
          </Flex>
        )}
      </Flex>
    </Base>
  );
};

export const Base = styled(TouchableOpacity)``;
const StyledText = styled(Text)`
  text-decoration: underline;
  text-decoration-color: ${(p) => p.theme.colors.neutral.c100};
`;

export default NotificationCard;
