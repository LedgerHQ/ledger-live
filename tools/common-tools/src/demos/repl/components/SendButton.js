// @flow
import React from "react";
import styled from "styled-components";

const Button = styled.button`
  padding: 0.6em 1.2em;
  font-size: 16px;
  color: ${props =>
  props.disabled ? props.theme.buttonDisabledText : props.theme.buttonText};
  background-color: ${props =>
  props.secondary
    ? "transparent"
    : props.disabled
    ? props.theme.buttonDisabled
    : props.red
      ? props.theme.buttonRed
      : props.theme.button};
  border-radius: 4px;
  cursor: ${props =>
  props.disabled ? 'default' : 'pointer'};
  text-align: center;
  border-style: none;
  
  &:focus {
    outline: none;
  }
`;

type Props = {
  onClick: () => any,
  title: string,
  disabled?: boolean,
  secondary?: boolean,
  red?: boolean,
  className?: string
};

const SendButton = ({ onClick, title, disabled, secondary, red, className }: Props) => (
  <Button
    red={red}
    className={className}
    secondary={secondary}
    onClick={disabled ? undefined : onClick}
    disabled={disabled}
  >
    {title}
  </Button>
);

export default SendButton;
