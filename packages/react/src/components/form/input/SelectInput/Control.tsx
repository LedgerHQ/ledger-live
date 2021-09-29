import React from "react";
import { components, Styles, ControlProps } from "react-select";
import styled from "styled-components";
import { InputContainer } from "../BaseInput";

export const getStyles: Styles<any, any>["control"] = function getStyles(provided) {
  return {
    ...provided,
    display: "flex",
    alignItems: "center",
    width: "100%",
    border: 0,
    boxShadow: "none",
    borderRadius: "inherit",
    background: "transparent",
  };
};

const Container = styled(InputContainer)`
  padding: 0 ${(p) => p.theme.space[7]}px;
`;

export function Control(props: ControlProps<any, any>) {
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
