import React, { useEffect } from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import styled, { useTheme } from "styled-components/native";
import { TouchableOpacity } from "react-native";
import { Options, OptionsType } from "LLM/features/WalletSync/types/Activation";
import { useTranslation } from "react-i18next";
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
  font-family: Inter;
  line-height: 14.52px;
  text-align: center;
  font-size: 12px;
  color: ${({ isSelected, theme }) => (isSelected ? theme.colors.constant.black : "#717070")};
`;

interface OptionButtonProps {
  option: OptionsType;
  selectedOption: OptionsType;
  handleSelectOption: (option: OptionsType) => void;
  label: string;
}

const OptionButton: React.FC<OptionButtonProps> = ({
  option,
  selectedOption,
  handleSelectOption,
  label,
}) => {
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

interface TabSelectorProps {
  selectedOption: OptionsType;
  handleSelectOption: (option: OptionsType) => void;
}

const TabSelector: React.FC<TabSelectorProps> = ({ selectedOption, handleSelectOption }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const translateX = useSharedValue(-39);

  useEffect(() => {
    translateX.value = withSpring(selectedOption === Options.SCAN ? -39 : 39, {
      damping: 30,
      stiffness: 80,
    });
  }, [selectedOption, translateX]);

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
            width: "50%",
            height: "98%",
            backgroundColor: "#BBB0FF",
            borderRadius: 40,
          },
          animatedStyle,
        ]}
      />
      <OptionButton
        option={Options.SCAN}
        selectedOption={selectedOption}
        handleSelectOption={handleSelectOption}
        label={t("walletSync.synchronize.qrCode.scan.title")}
      />
      <OptionButton
        option={Options.SHOW_QR}
        selectedOption={selectedOption}
        handleSelectOption={handleSelectOption}
        label={t("walletSync.synchronize.qrCode.show.title")}
      />
    </Flex>
  );
};

export default TabSelector;
