import { Flex, Text } from "@ledgerhq/native-ui";
import React, { useCallback, useState } from "react";
import { Pressable, StyleSheet } from "react-native";

interface TitleWithTooltipProps {
  name?: string;
}

const TitleWithTooltip: React.FC<TitleWithTooltipProps> = ({ name }) => {
  const [showTitleTooltip, setShowTitleTooltip] = useState(false);

  const handleLongPress = useCallback(() => {
    setShowTitleTooltip(true);
  }, []);

  const handlePressOut = useCallback(() => {
    setShowTitleTooltip(false);
  }, []);

  return (
    <Flex flex={1} flexShrink={1} ml={3} position="relative">
      <Pressable
        testID="market-detail-title-pressable"
        onLongPress={handleLongPress}
        onPressOut={handlePressOut}
      >
        <Text variant="large" fontSize={22} numberOfLines={1} ellipsizeMode="tail">
          {name}
        </Text>
      </Pressable>
      {showTitleTooltip && (
        <Flex
          position="absolute"
          bottom="100%"
          mb={2}
          zIndex={1000}
          p={3}
          flexDirection="row"
          justifyContent="flex-start"
          alignItems="center"
          borderRadius={8}
          backgroundColor="neutral.c100"
          maxWidth="90%"
          style={styles.tooltip}
        >
          <Text variant="body" fontSize={14} color="neutral.c00">
            {name}
          </Text>
        </Flex>
      )}
    </Flex>
  );
};

const styles = StyleSheet.create({
  tooltip: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default TitleWithTooltip;
