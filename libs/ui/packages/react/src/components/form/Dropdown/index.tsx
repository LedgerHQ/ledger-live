import React from "react";
import { components, GroupBase, ControlProps, ValueContainerProps } from "react-select";
import { useTheme } from "styled-components";
import SelectInput, { Props as SelectInputProps } from "../../form/SelectInput";
import Text from "../../asorted/Text";
import { IconsLegacy } from "../../../";
import { ValueContainer } from "../../form/SelectInput/ValueContainer";
import FlexBox from "../../layout/Flex";

export type Props<O> = SelectInputProps<O, false, GroupBase<O>> & {
  label: string;
};

function DropdownControl<O, M extends boolean, G extends GroupBase<O>>(
  props: ControlProps<O, M, G>,
) {
  const { selectProps, children } = props;
  const { label } = selectProps as unknown as Props<O>;

  return (
    <components.Control {...props}>
      <Text variant="paragraph" fontWeight="medium" color="neutral.c80" mr={2}>
        {label}
      </Text>
      {children}
    </components.Control>
  );
}

function DropdownValueContainer<O>(props: ValueContainerProps<O, false>) {
  const isOpen = props.selectProps.menuIsOpen;

  return (
    <ValueContainer
      {...props}
      render={() => (
        <FlexBox alignItems="center">
          <Text variant="paragraph" fontWeight="medium" mr={2}>
            <FlexBox>{props.children}</FlexBox>
          </Text>
          <FlexBox alignItems="center" style={{ transform: isOpen ? "rotate(180deg)" : "" }}>
            <IconsLegacy.DropdownMedium size={20} />
          </FlexBox>
        </FlexBox>
      )}
    />
  );
}

function DropdownIndicatorsContainer() {
  return null;
}

export default function Dropdown<O>(props: Props<O>): JSX.Element {
  const theme = useTheme();
  const { styles, ...rest } = props;

  return (
    <SelectInput
      placeholder=""
      isSearchable={false}
      styles={{
        singleValue: provided => ({
          ...provided,
          color: theme.colors.neutral.c100,
          margin: 0,
          top: undefined,
          position: undefined,
          overflow: undefined,
          maxWidth: undefined,
          transform: undefined,
        }),
        input: () => ({ display: "none" }),
        menu: provided => ({
          ...provided,
          border: 0,
          boxShadow: "none",
          background: "none",
          width: "auto",
          minWidth: "200px",
        }),
        ...styles,
      }}
      {...rest}
      components={{
        Control: DropdownControl,
        ValueContainer: DropdownValueContainer,
        IndicatorsContainer: DropdownIndicatorsContainer,
      }}
    />
  );
}
