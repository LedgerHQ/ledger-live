import React from "react";
import { components, ControlProps } from "react-select";
import { useTheme } from "styled-components";
import SelectInput, {
  Props as SelectInputProps,
} from "@ledgerhq/react-ui/components/form/SelectInput/index";
import { Text, Flex as FlexBox, IconsLegacy } from "@ledgerhq/react-ui";
import {
  ValueContainer,
  MixedProps as ValueContainerProps,
} from "@ledgerhq/react-ui/components/form/SelectInput/ValueContainer";

export type Props<O> = SelectInputProps<O> & {
  searchable?: boolean;
  label?: React.ReactNode;
};

function DropdownControl<O>(props: ControlProps<O, false>) {
  const { children } = props;

  return (
    <components.Control {...props}>
      <Text fontWeight="semiBold" p="0" variant={"paragraph"} color="neutral.c80">
        {children}
      </Text>
    </components.Control>
  );
}

function DropdownValueContainer<O>(
  props: ValueContainerProps<O, false> & { label?: React.ReactNode },
) {
  const ChevronIcon = props.selectProps.menuIsOpen
    ? IconsLegacy.ChevronTopMedium
    : IconsLegacy.ChevronBottomMedium;
  // @ts-expect-error This label prop is inherited from the original component props but it is not handled well in the react-select bindings
  const { label } = props.selectProps;

  return (
    <ValueContainer
      {...props}
      render={() => (
        <FlexBox alignItems="center" flexDirection="row">
          <Text fontWeight="semiBold" variant={"paragraph"} color="neutral.c80" mr={2}>
            {label}
          </Text>
          <Text fontWeight="semiBold" variant={"paragraph"} mr={2}>
            <FlexBox>{props.children}</FlexBox>
          </Text>
          <FlexBox alignItems="center">
            <ChevronIcon size={12} />
          </FlexBox>
        </FlexBox>
      )}
    />
  );
}

function DropdownIndicatorsContainer() {
  return null;
}

export default function Dropdown<O>(props: Props<O>): React.JSX.Element {
  const theme = useTheme();

  return (
    <SelectInput
      placeholder=""
      isSearchable={props.searchable}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      styles={
        {
          singleValue: (provided: object) => ({
            ...provided,
            color: theme.colors.neutral.c100,
            margin: 0,
            top: undefined,
            position: undefined,
            overflow: undefined,
            maxWidth: undefined,
            transform: undefined,
            lineHeight: "32px",
          }),
          menu: (provided: object) => ({
            ...provided,
            border: 0,
            boxShadow: "none",
            background: "none",
            width: "max-content",
            minWidth: "100px",
            margin: 0,
            padding: 0,
            right: 0,
          }),
          control: () => ({
            padding: 0,
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            display: "flex",
          }),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any
      }
      {...props}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      components={
        {
          Control: DropdownControl,
          ValueContainer: DropdownValueContainer,
          IndicatorsContainer: DropdownIndicatorsContainer,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any
      }
    />
  );
}
