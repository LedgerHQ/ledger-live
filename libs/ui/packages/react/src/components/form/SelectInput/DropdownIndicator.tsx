import React from "react";
import { components, GroupBase, StylesConfig, DropdownIndicatorProps } from "react-select";
import { useTheme } from "styled-components";
import Text from "../../asorted/Text";
import { ChevronBottomMedium, ChevronTopMedium } from "@ledgerhq/icons-ui/react";

export function getStyles<
  O = unknown,
  M extends boolean = false,
  G extends GroupBase<O> = GroupBase<O>,
>(): NonNullable<StylesConfig<O, M, G>["dropdownIndicator"]> {
  return (provided) => ({
    ...provided,
    padding: 0,
  });
}

export function DropdownIndicator<
  O = unknown,
  M extends boolean = false,
  G extends GroupBase<O> = GroupBase<O>,
>(props: DropdownIndicatorProps<O, M, G>): JSX.Element {
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
