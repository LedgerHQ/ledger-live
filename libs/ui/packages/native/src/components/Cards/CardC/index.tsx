import React from "react";
import { TouchableOpacityProps } from "react-native";
import { ExternalLinkMedium } from "@ledgerhq/icons-ui/native";
import Text from "../../Text";
import Flex from "../../Layout/Flex";
import Box from "../../Layout/Box";
import Link from "../../cta/Link";

export type CardProps = TouchableOpacityProps & {
  tag?: string;
  description?: string;
  cta?: string;
  time?: string;
  title?: string;
  onPressDismiss?: () => void;
};

const Tag = ({ tag }: { tag: string }) => (
  <Flex bg="neutral.c100a01" borderRadius={6} px={3} py="3px" maxWidth="75%">
    <Text variant="small" fontWeight="semiBold" color="neutral.c90" numberOfLines={1}>
      {tag}
    </Text>
  </Flex>
);

const Timer = ({ time }: { time: string }) => (
  <Flex flexDirection="row" justifyContent="space-between" alignItems="center" ml={2}>
    <Text variant="small" fontWeight="semiBold" color="neutral.c90" numberOfLines={1}>
      {time}
    </Text>
    <Box ml={3} backgroundColor="error.c50" height="8px" width="8px" borderRadius={24} />
  </Flex>
);

const CardB = (props: CardProps): React.ReactElement => {
  const { tag = "", time = "", title, description, cta } = props;
  return (
    <Flex width="100%" flexDirection="column">
      <Flex flexDirection="row" justifyContent="space-between">
        <Tag tag={tag} />
        <Timer time={time} />
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
        mb={4}
      >
        {description}
      </Text>

      <Flex alignItems="flex-start">
        <Link
          type="main"
          size="medium"
          iconPosition="right"
          Icon={() => <ExternalLinkMedium color="neutral.c100" />}
          onPress={props.onPress}
          numberOfLines={1}
        >
          <Text
            variant="bodyLineHeight"
            fontWeight="semiBold"
            color="neutral.c100"
            numberOfLines={1}
          >
            {cta}
          </Text>
        </Link>
      </Flex>
    </Flex>
  );
};

export default CardB;
