import React, { memo } from "react";
import {
  TouchableOpacityProps,
  TouchableOpacity,
  Image,
  ImageProps,
  StyleSheet,
} from "react-native";
import styled from "styled-components/native";

import Text from "../../Text";
import Flex from "../../Layout/Flex";

export type CardProps = TouchableOpacityProps & {
  tag?: React.ReactNode;
  title?: React.ReactNode;
  imageUrl?: string;
  onClickCard?: () => void;
  imageProps?: Partial<ImageProps>;
};

const Base = styled(TouchableOpacity)``;
const ImageContent = styled(Image)`
  border-radius: 8px;
`;

const styles = StyleSheet.create({
  image: {
    flex: 1,
    backgroundColor: "#fff",
    width: "100%",
  },
});

const CardContainer = (props: CardProps): React.ReactElement => {
  const { imageUrl, title, tag, imageProps } = props;

  return (
    <Flex flexDirection="row">
      <Flex
        justifyContent="space-between"
        alignItems="flex-start"
        py={2}
        pr={imageUrl ? 4 : 2}
        flex={1}
      >
        <Text variant="body" fontWeight="medium" color="neutral.c100" numberOfLines={2}>
          {title}
        </Text>
        <Text variant="paragraph" fontWeight="medium" color="neutral.c70" numberOfLines={1} mt={4}>
          {tag}
        </Text>
      </Flex>

      {imageUrl && (
        <ImageContent
          source={{
            uri: imageUrl,
          }}
          style={styles.image}
          {...imageProps}
        />
      )}
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

export default memo(InformativeCard);
