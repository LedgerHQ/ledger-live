import React from "react";
import { components, Styles, ControlProps, OptionTypeBase } from "react-select";
import styled from "styled-components";
import { InputContainer } from "../BaseInput";

export function getStyles<
  T extends OptionTypeBase = { label: string; value: string },
  M extends boolean = false,
>(): NonNullable<Styles<T, M>["control"]> {
  return (provided) => ({
    ...provided,
    display: "flex",
    alignItems: "center",
    width: "100%",
    border: 0,
    boxShadow: "none",
    borderRadius: "inherit",
    background: "transparent",
  });
}

const Container = styled(InputContainer)`
  padding: 0 ${(p) => p.theme.space[7]}px;
`;

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
    <Container disabled={isDisabled} error={error} focus={isFocused}>
      <components.Control {...props}>
        {renderLeft ? renderLeft(props) : null}
        {children}
      </components.Control>
    </Container>
  );
}
