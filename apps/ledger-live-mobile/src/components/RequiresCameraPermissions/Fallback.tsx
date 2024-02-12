import React, { memo } from "react";
import { StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useTheme } from "styled-components/native";
import { Text, Flex } from "@ledgerhq/native-ui";
import Button from "../Button";
import FallbackCamera from "~/icons/FallbackCamera";

type Props = {
  title: string;
  description: string;
  buttonTitle: string;
  onPress: () => void;
  event: string;
};

const IconSettings = () => <Icon name="settings" size={16} color="neutral.c100" />;

const FallbackCameraBody: React.FC<Props> = ({
  title,
  description,
  buttonTitle,
  onPress,
  event,
}: Props) => {
  const { colors } = useTheme();

  return (
    <Flex flex={1} bg="background.main" px={6}>
      <Flex flex={1} alignItems="center" justifyContent="center">
        <FallbackCamera color={colors.constant.white} />
        <Text variant="paragraph" mt={9} mb={3} fontSize={6}>
          {title}
        </Text>
        <Text variant="paragraph" color="neutral.c70" mb={10}>
          {description}
        </Text>
        <Button
          event={event}
          type="primary"
          title={buttonTitle}
          onPress={onPress}
          containerStyle={styles.buttonContainer}
          IconLeft={IconSettings}
        />
      </Flex>
    </Flex>
  );
};

export default memo<Props>(FallbackCameraBody);

const styles = StyleSheet.create({
  buttonContainer: {
    width: 290,
  },
});
