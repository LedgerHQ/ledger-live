// @flow
import React from "react";
import styled from "styled-components";

const Button = styled.div`
  padding: 0.6em 1.2em;
  font-size: 16px;
  color: ${props => (props.disabled ? "#999" : "#fff")};
  background-color: ${props => (props.disabled ? "#eee" : "#6490f1")};
  border-radius: 4px;
  cursor: pointer;
  text-align: center;
`;

type Props = {
  onClick: () => void,
  title: string,
  disabled?: boolean
};

const SendButton = ({ onClick, title, disabled }: Props) => (
  <Button onClick={disabled ? undefined : onClick} disabled={disabled}>
    {title}
  </Button>
);

export default SendButton;
