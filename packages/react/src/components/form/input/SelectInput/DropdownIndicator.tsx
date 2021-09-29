import React from "react";
import { components, Styles, IndicatorProps } from "react-select";
import { useTheme } from "styled-components";
import Text from "@components/asorted/Text";
import { ChevronBottomMedium, ChevronTopMedium } from "@assets/icons";

export const getStyles: Styles<any, any>["dropdownIndicator"] = function getStyles(provided) {
  return {
    ...provided,
    padding: 0,
  };
};

export function DropdownIndicator(props: IndicatorProps<any, any>) {
  const theme = useTheme();
  const { isDisabled } = props.selectProps;

  const ChevronIcon = props.selectProps.menuIsOpen ? ChevronTopMedium : ChevronBottomMedium;
  const color = isDisabled ? theme.colors.palette.neutral.c60 : theme.colors.palette.neutral.c100;

  return (
    <components.DropdownIndicator {...props}>
      <Text as="div" color={color} style={{ display: "flex" }}>
        <ChevronIcon size={12} />
      </Text>
    </components.DropdownIndicator>
  );
}
