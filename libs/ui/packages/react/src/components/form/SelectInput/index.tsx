import React, { memo, useMemo } from "react";
import Select, {
  Props as SelectProps,
  ControlProps,
  IndicatorsContainerProps,
  GroupBase,
  StylesConfig,
} from "react-select";
import { DefaultTheme, useTheme } from "styled-components";
import * as DropdownIndicatorModule from "./DropdownIndicator";
import * as ValueContainerModule from "./ValueContainer";
import * as ControlModule from "./Control";
import * as MenuListModule from "./MenuList";
import * as OptionModule from "./Option";
import { IndicatorsContainer } from "./IndicatorsContainer";
import { InputErrorContainer } from "../BaseInput";

export type SelfProps<O, M extends boolean, G extends GroupBase<O>> = {
  /* An error which will be displayed below the component and will change the style. */
  error?: string;
  /* A component which will be rendered on the left side of the select. */
  renderLeft?: (props: ControlProps<O, M, G>) => React.ReactNode;
  /* A component which will be rendered on the right side of the select, before the indicators. */
  renderRight?: (props: IndicatorsContainerProps<O, M, G>) => React.ReactNode;
  /* This value is used to calculate the height of the menu list when dealing with virtual lists. */
  rowHeight?: number;
  /* Removes all wrappers when rendering the element. */
  unwrapped?: boolean;
  /* Extends defined styles. */
  extendStyles?: (styles: StylesConfig<O, M, G>) => StylesConfig<O, M, G>;
};
export type Props<
  O = unknown,
  M extends boolean = false,
  G extends GroupBase<O> = GroupBase<O>,
> = SelectProps<O, M, G> & SelfProps<O, M, G>;

const stylesFn = <O, M extends boolean, G extends GroupBase<O>>(
  theme: DefaultTheme,
): StylesConfig<O, M, G> => ({
  control: ControlModule.getStyles(theme),
  valueContainer: ValueContainerModule.getStyles(),
  dropdownIndicator: DropdownIndicatorModule.getStyles(),
  menuList: MenuListModule.getStyles(theme),
  option: OptionModule.getStyles(),
  input: (provided) => ({
    ...provided,
    color: theme.colors.neutral.c100,
  }),
  placeholder: (provided) => ({
    ...provided,
    color: theme.colors.neutral.c60,
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "inherit",
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: theme.colors.primary.c20,
    borderRadius: theme.radii[1],
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: theme.colors.neutral.c100,
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    cursor: "pointer",
    ":hover": {
      color: theme.colors.error.c50,
      backgroundColor: theme.colors.error.c30,
    },
  }),
  menu: (provided) => ({
    ...provided,
    border: 0,
    boxShadow: "none",
    background: "none",
  }),
});

function SelectInput<O, M extends boolean, G extends GroupBase<O>>({
  error,
  rowHeight = 48,
  unwrapped,
  extendStyles,
  ...props
}: Props<O, M, G>): JSX.Element {
  const theme = useTheme();
  const styles = useMemo(
    () => (extendStyles ? extendStyles(stylesFn<O, M, G>(theme)) : stylesFn<O, M, G>(theme)),
    [theme, extendStyles],
  );
  const { isDisabled, components = {} } = props;

  const innerContent = (
    <Select
      {...props}
      styles={{
        ...styles,
        ...props.styles,
      }}
      classNamePrefix="react-select"
      components={{
        Control: ControlModule.Control,
        ValueContainer: ValueContainerModule.ValueContainer,
        IndicatorsContainer,
        DropdownIndicator: DropdownIndicatorModule.DropdownIndicator,
        MenuList: MenuListModule.MenuList,
        Option: OptionModule.Option,
        IndicatorSeparator: null,
        ...components,
      }}
      // @ts-expect-error We want to be able to pass extra props here…
      rowHeight={rowHeight}
    />
  );

  if (unwrapped) return innerContent;

  return (
    <div>
      {innerContent}
      {error && !isDisabled && (
        <InputErrorContainer variant={"paragraph"}>{error}</InputErrorContainer>
      )}
    </div>
  );
}

export default memo(SelectInput) as typeof SelectInput;
