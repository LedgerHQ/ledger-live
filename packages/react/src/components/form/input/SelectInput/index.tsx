import React, { memo, useMemo } from "react";
import Select, { Props as SelectProps, Styles } from "react-select";
import { DefaultTheme, useTheme } from "styled-components";
import * as DropdownIndicatorModule from "./DropdownIndicator";
import * as ValueContainerModule from "./ValueContainer";
import * as ControlModule from "./Control";
import * as MenuListModule from "./MenuList";
import * as OptionModule from "./Option";
import { IndicatorsContainer } from "./IndicatorsContainer";
import { InputErrorContainer } from "../BaseInput";

export type SelfProps = {
  /* An error which will be displayed below the component and will change the style. */
  error?: string;
  /* A component which will be rendered on the left side of the select. */
  renderLeft?: (props: Props) => React.ReactNode;
  /* A component which will be rendered on the right side of the select, before the indicators. */
  renderRight?: (props: Props) => React.ReactNode;
  /* This value is used to calculate the height of the menu list when dealing with virtual lists. */
  rowHeight?: number;
};
export type Props = SelectProps & SelfProps;

const stylesFn = (theme: DefaultTheme): Styles<any, any> => ({
  control: ControlModule.getStyles,
  valueContainer: ValueContainerModule.getStyles,
  dropdownIndicator: DropdownIndicatorModule.getStyles,
  menuList: MenuListModule.getStyles(theme),
  option: OptionModule.getStyles,
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

function SelectInput({ error, rowHeight = 48, ...props }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => stylesFn(theme), [theme]);
  const { isDisabled, components = {} } = props;

  return (
    <div>
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
      {error && !isDisabled && <InputErrorContainer fontSize={3}>{error}</InputErrorContainer>}
    </div>
  );
}

export default memo(SelectInput);
