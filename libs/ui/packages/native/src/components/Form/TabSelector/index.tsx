import React, { useEffect } from "react";
import Text from "../../Text";
import Flex from "../../Layout/Flex";
import styled, { useTheme } from "styled-components/native";
import { TouchableOpacity } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";

const StyledTouchableOpacity = styled(TouchableOpacity)`
  flex: 1;
  overflow: hidden;
`;

const StyledFlex = styled(Flex)<{ isSelected: boolean }>`
  width: 100%;
  height: 100%;
  justify-content: center;
  align-items: center;
`;

const StyledText = styled(Text)<{ isSelected: boolean }>`
  line-height: 14.52px;
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
}

const OptionButton = <T,>({
  option,
  selectedOption,
  handleSelectOption,
  label,
}: OptionButtonProps<T>) => {
  const isSelected = selectedOption === option;

  return (
    <StyledTouchableOpacity onPress={() => handleSelectOption(option)}>
      <StyledFlex isSelected={isSelected}>
        <StyledText
          fontWeight="semiBold"
          isSelected={isSelected}
          ellipsizeMode="tail"
          numberOfLines={1}
        >
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

export default function TabSelector<T extends string | number>({
  options,
  selectedOption,
  handleSelectOption,
  labels,
}: TabSelectorProps<T>): JSX.Element {
  const { colors } = useTheme();
  const translateX = useSharedValue(-39);

  useEffect(() => {
    translateX.value = withSpring(selectedOption === options[0] ? -40 : 40, {
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
      width={"157px"}
      height={"35px"}
      borderRadius={"40px"}
      padding={"2px"}
      bg={colors.opacityDefault.c05}
    >
      <Animated.View
        style={[
          {
            position: "absolute",
            width: "48%",
            height: "96%",
            backgroundColor: colors.primary.c80,
            borderRadius: 40,
          },
          animatedStyle,
        ]}
      />
      {options.map((option) => (
        <OptionButton
          key={option as unknown as string}
          option={option}
          selectedOption={selectedOption}
          handleSelectOption={handleSelectOption}
          label={labels[option]}
        />
      ))}
    </Flex>
  );
}
