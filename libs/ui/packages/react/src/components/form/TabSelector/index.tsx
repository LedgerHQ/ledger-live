import React, { useEffect } from "react";
import styled, { useTheme } from "styled-components";
import Flex from "../../layout/Flex";
import Text from "../../asorted/Text";
import { motion, useAnimation } from "framer-motion";

const StyledButton = styled(Flex)`
  cursor: pointer;
  justify-content: center;
  align-items: center;
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
  color: ${p => (p.isSelected ? p.theme.colors.constant.black : p.theme.colors.opacityDefault.c50)};
  z-index: 10;
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
    <StyledButton width={width} onClick={() => handleSelectOption(option)}>
      <StyledFlex isSelected={isSelected}>
        <StyledText fontWeight="semiBold" isSelected={isSelected}>
          {label}
        </StyledText>
      </StyledFlex>
    </StyledButton>
  );
};

export interface TabSelectorProps<T extends string | number> {
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
}: TabSelectorProps<T>): React.JSX.Element {
  const { colors } = useTheme();

  const longuestLabel =
    labels[options[0]].length > labels[options[1]].length ? options[0] : options[1];

  const widthFactor = 8;
  const margin = 20;
  const width = labels[longuestLabel].length * widthFactor + margin;
  const semiWidth = width / 2;
  const controls = useAnimation();

  useEffect(() => {
    controls.start({
      x: selectedOption === options[0] ? -semiWidth : semiWidth,
      transition: { type: "spring", damping: 30, stiffness: 130 },
    });
  }, [selectedOption, controls, options, semiWidth]);

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
      <motion.div
        style={{
          position: "absolute",
          width: width,
          height: "90%",
          backgroundColor: colors.primary.c80,
          borderRadius: 40,
        }}
        animate={controls}
      />
      {options.map(option => (
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
