import React from "react";
import { components, Styles, ControlProps, OptionTypeBase } from "react-select";
import { DefaultTheme } from "styled-components";
import { InputContainer } from "../BaseInput";

export function getStyles<
  T extends OptionTypeBase = { label: string; value: string },
  M extends boolean = false,
>(theme: DefaultTheme): NonNullable<Styles<T, M>["control"]> {
  return (provided) => ({
    ...provided,
    display: "flex",
    alignItems: "center",
    width: "100%",
    border: 0,
    padding: `0px ${theme.space[7]}px`,
    boxShadow: "none",
    borderRadius: "inherit",
    background: "transparent",
  });
}

export function Control<
  T extends OptionTypeBase = { label: string; value: string },
  M extends boolean = false,
>(props: ControlProps<T, M>): JSX.Element {
  const {
    isFocused,
    selectProps: { isDisabled, error, renderLeft },
    children,
  } = props;

  return (
    <InputContainer disabled={isDisabled} error={error} focus={isFocused}>
      <components.Control {...props}>
        {renderLeft ? renderLeft(props) : null}
        {children}
      </components.Control>
    </InputContainer>
  );
}
