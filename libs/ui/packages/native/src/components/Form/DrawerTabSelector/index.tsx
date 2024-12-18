import React, { useEffect } from "react";
import Text from "../../Text";
import Flex from "../../Layout/Flex";
import styled, { useTheme } from "styled-components/native";
import { TouchableOpacity } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";

const StyledTouchableOpacity = styled(TouchableOpacity)<{ width: number }>`
  width: ${(p) => p.width}px;
  flex: 1;
  height: 100%;
`;

const StyledFlex = styled(Flex)<{ isSelected: boolean }>`
  height: 100%;
  justify-content: center;
  align-items: center;
`;

const StyledText = styled(Text)<{ isSelected: boolean }>`
  line-height: 14.52px;
  overflow: visible;
  text-align: center;
  font-size: 12px;
  color: ${(p) =>
    p.isSelected ? p.theme.colors.constant.black : p.theme.colors.opacityDefault.c50};
`;

interface OptionButtonProps<T> {
  option: T;
  selectedOption: T;
  handleSelectOption: (option: T) => void;
  label: string;
  width: number;
}

const OptionButton = <T,>({
  option,
  selectedOption,
  handleSelectOption,
  label,
  width,
}: OptionButtonProps<T>) => {
  const isSelected = selectedOption === option;

  return (
    <StyledTouchableOpacity width={width} onPress={() => handleSelectOption(option)}>
      <StyledFlex isSelected={isSelected}>
        <StyledText fontWeight="semiBold" isSelected={isSelected} numberOfLines={1}>
          {label}
        </StyledText>
      </StyledFlex>
    </StyledTouchableOpacity>
  );
};

interface TabSelectorProps<T extends string | number> {
  options: T[];
  selectedOption: T;
  handleSelectOption: (option: T) => void;
  labels: { [key in T]: string };
}

export default function DrawerTabSelector<T extends string | number>({
  options,
  selectedOption,
  handleSelectOption,
  labels,
}: TabSelectorProps<T>): JSX.Element {
  const { colors } = useTheme();

  const longuestLabel =
    labels[options[0]].length > labels[options[1]].length ? options[0] : options[1];

  const widthFactor = 8;
  const margin = 20;
  const width = labels[longuestLabel].length * widthFactor + margin;
  const semiWidth = width / 2;
  const translateX = useSharedValue(-semiWidth);

  useEffect(() => {
    translateX.value = withSpring(selectedOption === options[0] ? -semiWidth : semiWidth, {
      damping: 30,
      stiffness: 80,
    });
  }, [selectedOption, translateX, options]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <Flex
      flexDirection={"row"}
      justifyContent={"center"}
      alignItems={"center"}
      width={width * 2 + 4}
      height={"35px"}
      borderRadius={"40px"}
      bg={colors.opacityDefault.c05}
      position={"relative"}
    >
      <Animated.View
        style={[
          {
            position: "absolute",
            width: width - 2,
            height: "90%",
            backgroundColor: colors.primary.c80,
            borderRadius: 40,
          },
          animatedStyle,
        ]}
      />
      {options.map((option) => (
        <OptionButton
          width={width}
          key={option}
          option={option}
          selectedOption={selectedOption}
          handleSelectOption={handleSelectOption}
          label={labels[option]}
        />
      ))}
    </Flex>
  );
}
