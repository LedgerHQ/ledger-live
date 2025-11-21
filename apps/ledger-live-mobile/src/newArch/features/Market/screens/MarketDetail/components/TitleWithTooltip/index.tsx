import React, { useState, useCallback } from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import { Pressable, StyleSheet, Image } from "react-native";
import { StyledIconContainer } from "../../../../components/MarketRowItem/MarketRowItem.styled";

interface TitleWithTooltipProps {
  name?: string;
  image?: string;
}

const TitleWithTooltip: React.FC<TitleWithTooltipProps> = ({ name, image }) => {
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
          {image && (
            <StyledIconContainer>
              <Image
                source={{ uri: image }}
                style={{ width: 32, height: 32 }}
                resizeMode="contain"
              />
            </StyledIconContainer>
          )}
          <Text
            paddingLeft={2}
            variant="large"
            fontSize={18}
            color="neutral.c00"
            ml={image ? 2 : 0}
          >
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
