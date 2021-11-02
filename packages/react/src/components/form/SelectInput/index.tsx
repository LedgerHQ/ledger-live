import React, { memo, useMemo } from "react";
import Select, { Props as SelectProps, OptionTypeBase, Styles } from "react-select";
import { DefaultTheme, useTheme } from "styled-components";
import * as DropdownIndicatorModule from "./DropdownIndicator";
import * as ValueContainerModule from "./ValueContainer";
import * as ControlModule from "./Control";
import * as MenuListModule from "./MenuList";
import * as OptionModule from "./Option";
import { IndicatorsContainer } from "./IndicatorsContainer";
import { InputErrorContainer } from "../BaseInput";

export type SelfProps<
  T extends OptionTypeBase = { label: string; value: string },
  M extends boolean = false,
> = {
  /* An error which will be displayed below the component and will change the style. */
  error?: string;
  /* A component which will be rendered on the left side of the select. */
  renderLeft?: (props: Props<T, M>) => React.ReactNode;
  /* A component which will be rendered on the right side of the select, before the indicators. */
  renderRight?: (props: Props<T, M>) => React.ReactNode;
  /* This value is used to calculate the height of the menu list when dealing with virtual lists. */
  rowHeight?: number;
  /* Removes all wrappers when rendering the element. */
  unwrapped?: boolean;
};
export type Props<
  T extends OptionTypeBase = { label: string; value: string },
  M extends boolean = false,
> = SelectProps<T, M> & SelfProps<T, M>;

const stylesFn = <
  T extends OptionTypeBase = { label: string; value: string },
  M extends boolean = false,
>(
  theme: DefaultTheme,
): Styles<T, M> => ({
  control: ControlModule.getStyles(),
  valueContainer: ValueContainerModule.getStyles(),
  dropdownIndicator: DropdownIndicatorModule.getStyles(),
  menuList: MenuListModule.getStyles(theme),
  option: OptionModule.getStyles(),
  input: (provided) => ({
    ...provided,
    color: theme.colors.palette.neutral.c100,
  }),
  placeholder: (provided) => ({
    ...provided,
    color: theme.colors.palette.neutral.c60,
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "inherit",
  }),
  menu: (provided) => ({
    ...provided,
    border: 0,
    boxShadow: "none",
    background: "none",
  }),
});

function SelectInput<
  T extends OptionTypeBase = { label: string; value: string },
  M extends boolean = false,
>({ error, rowHeight = 48, unwrapped, ...props }: Props<T, M>): JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => stylesFn<T, M>(theme), [theme]);
  const { isDisabled, components = {} } = props;

  const innerContent = (
    <Select
      {...props}
      error={error}
      styles={{
        ...styles,
        ...props.styles,
      }}
      classNamePrefix="react-select"
      rowHeight={rowHeight}
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
