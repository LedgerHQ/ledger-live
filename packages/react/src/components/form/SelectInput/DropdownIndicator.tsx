import React from "react";
import { components, Styles, IndicatorProps, OptionTypeBase } from "react-select";
import { useTheme } from "styled-components";
import Text from "../../asorted/Text";
import { ChevronBottomMedium, ChevronTopMedium } from "@ledgerhq/icons-ui/react";

export function getStyles<
  T extends OptionTypeBase = { label: string; value: string },
  M extends boolean = false,
>(): NonNullable<Styles<T, M>["dropdownIndicator"]> {
  return (provided) => ({
    ...provided,
    padding: 0,
  });
}

export function DropdownIndicator<
  T extends OptionTypeBase = { label: string; value: string },
  M extends boolean = false,
>(props: IndicatorProps<T, M>): JSX.Element {
  const theme = useTheme();
  const { isDisabled } = props.selectProps;

  const ChevronIcon = props.selectProps.menuIsOpen ? ChevronTopMedium : ChevronBottomMedium;
  const color = isDisabled ? theme.colors.neutral.c60 : theme.colors.neutral.c100;

  return (
    <components.DropdownIndicator {...props}>
      <Text as="div" color={color} style={{ display: "flex" }}>
        <ChevronIcon size={12} />
      </Text>
    </components.DropdownIndicator>
  );
}
