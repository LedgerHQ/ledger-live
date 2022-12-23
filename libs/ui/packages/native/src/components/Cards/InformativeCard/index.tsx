import React from "react";
import { TouchableOpacityProps, TouchableOpacity, Image } from "react-native";
import styled from "styled-components/native";

import Text from "../../Text";
import Flex from "../../Layout/Flex";

export type CardProps = TouchableOpacityProps & {
  tag?: string;
  title?: string;
  imageUrl?: string;
  onClickCard?: () => void;
};

const Base = styled(TouchableOpacity)``;
const ImageContent = styled(Image)`
  border-radius: 8px;
`;

const CardContainer = (props: CardProps): React.ReactElement => {
  const { imageUrl, title, tag } = props;

  return (
    <Flex flexDirection="row">
      <Flex justifyContent="space-between" alignItems="flex-start" py={2} pr={4} flex={1}>
        <Text variant="body" fontWeight="medium" color="neutral.c100" numberOfLines={2}>
          {title}
        </Text>
        <Text variant="paragraph" fontWeight="medium" color="neutral.c70" numberOfLines={1} mt={4}>
          {tag}
        </Text>
      </Flex>

      <Flex width={100} height={75}>
        <ImageContent
          source={{
            uri: imageUrl,
          }}
          style={{ width: "100%", height: "100%" }}
        />
      </Flex>
    </Flex>
  );
};

const InformativeCard = (props: CardProps): React.ReactElement => {
  return (
    <Base {...props} activeOpacity={0.5} onPress={props.onClickCard}>
      <CardContainer {...props} />
    </Base>
  );
};

export default InformativeCard;
