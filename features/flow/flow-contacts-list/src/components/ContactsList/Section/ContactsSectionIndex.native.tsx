import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, PanResponder, View, type LayoutChangeEvent } from "react-native";
import { Box, Pressable, Text } from "@ledgerhq/lumen-ui-rnative";
import type { SelectSectionOptions } from "./useContactsSectionIndex.native";

type ContactsSectionIndexProps = Readonly<{
  sections: readonly string[];
  activeSectionTitle: string | undefined;
  onSelectSection: (title: string, options?: SelectSectionOptions) => void;
  verticalCenterOffset: number;
}>;

const sectionIndexItemHeight = 16;

function clampIndex(index: number, length: number): number {
  return Math.min(Math.max(index, 0), length - 1);
}

type ContactsSectionIndexItemProps = Readonly<{
  title: string;
  isActive: boolean;
  onPress: (title: string) => void;
}>;

function ContactsSectionIndexItem({
  title,
  isActive,
  onPress,
}: ContactsSectionIndexItemProps): React.JSX.Element {
  const emphasis = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(emphasis, {
      toValue: isActive ? 1 : 0,
      useNativeDriver: true,
      damping: 16,
      stiffness: 220,
    }).start();
  }, [emphasis, isActive]);

  return (
    <Pressable
      testID={`contacts-section-index-${title}`}
      onPress={() => onPress(title)}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ selected: isActive }}
      lx={{ width: "s24", height: "s16", alignItems: "center", justifyContent: "center" }}
    >
      <Animated.View
        style={{
          opacity: emphasis.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }),
          transform: [
            {
              scale: emphasis.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] }),
            },
          ],
        }}
      >
        <Text typography="body4" lx={{ color: "base" }}>
          {title}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function ContactsSectionIndex({
  sections,
  activeSectionTitle,
  onSelectSection,
  verticalCenterOffset,
}: ContactsSectionIndexProps): React.JSX.Element | null {
  const heightRef = useRef(0);
  const selectedSectionTitleRef = useRef<string | undefined>(undefined);
  const [height, setHeight] = useState(0);

  const selectSectionAt = useCallback(
    (locationY: number, animated: boolean) => {
      if (sections.length === 0) {
        return;
      }

      const sectionHeight =
        heightRef.current > 0 ? heightRef.current / sections.length : sectionIndexItemHeight;
      const sectionIndex = clampIndex(Math.floor(locationY / sectionHeight), sections.length);
      const section = sections[sectionIndex];

      if (section !== undefined && selectedSectionTitleRef.current !== section) {
        selectedSectionTitleRef.current = section;
        onSelectSection(section, { animated });
      }
    },
    [onSelectSection, sections],
  );

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const nextHeight = event.nativeEvent.layout.height;

    heightRef.current = nextHeight;
    setHeight(currentHeight => (currentHeight === nextHeight ? currentHeight : nextHeight));
  }, []);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        // The list scrolling underneath claims the responder on the first move otherwise.
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: event => {
          selectedSectionTitleRef.current = undefined;
          selectSectionAt(event.nativeEvent.locationY, true);
        },
        onPanResponderMove: event => selectSectionAt(event.nativeEvent.locationY, false),
        onPanResponderRelease: () => {
          selectedSectionTitleRef.current = undefined;
        },
        onPanResponderTerminate: () => {
          selectedSectionTitleRef.current = undefined;
        },
      }),
    [selectSectionAt],
  );

  if (sections.length === 0) {
    return null;
  }

  return (
    <View
      testID="contacts-section-index"
      onLayout={onLayout}
      pointerEvents="box-only"
      style={{
        position: "absolute",
        top: verticalCenterOffset - height / 2,
        right: 0,
      }}
      {...panResponder.panHandlers}
    >
      <Box>
        {sections.map(title => (
          <ContactsSectionIndexItem
            key={title}
            title={title}
            isActive={title === activeSectionTitle}
            onPress={onSelectSection}
          />
        ))}
      </Box>
    </View>
  );
}
