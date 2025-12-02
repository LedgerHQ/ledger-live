import React from "react";
import type { JSX } from "react";
import { components, GroupBase, StylesConfig, ControlProps } from "react-select";
import { DefaultTheme } from "styled-components";
import { InputContainer as BaseInputContainer, InputContainerStyleProps } from "../BaseInput";
import { Props as SelectProps } from "./index";

// Cast to avoid styled-components type inference issues with React 19
const InputContainer = BaseInputContainer as React.ComponentType<
  InputContainerStyleProps & { children?: React.ReactNode }
>;

export function getStyles<
  O = unknown,
  M extends boolean = false,
  G extends GroupBase<O> = GroupBase<O>,
>(theme: DefaultTheme): NonNullable<StylesConfig<O, M, G>["control"]> {
  return provided => ({
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
  O = unknown,
  M extends boolean = false,
  G extends GroupBase<O> = GroupBase<O>,
>(props: ControlProps<O, M, G>): JSX.Element {
  const { isFocused, selectProps, children } = props;

  const { isDisabled, error, renderLeft } = selectProps as SelectProps<O, M, G>;

  return (
    <InputContainer disabled={isDisabled} error={error} focus={isFocused}>
      <components.Control {...props}>
        {renderLeft ? renderLeft(props) : null}
        {children}
      </components.Control>
    </InputContainer>
  );
}
