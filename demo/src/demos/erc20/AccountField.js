// @flow
import React from "react";
import styled from "styled-components";

const Input = styled.input`
  outline: none;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
  color: #333;
  width: 100%;
  padding: 0.5em 1em;
  box-sizing: border-box;
`;

type Props = {
  value: string,
  onChange: string => void,
  autoFocus?: boolean
};

const AccountField = ({ value, onChange, autoFocus }: Props) => {
  return (
    <Input
      type="text"
      placeholder="ETH derivation path"
      value={value}
      onChange={e => onChange(e.target.value)}
      autoFocus={autoFocus}
    />
  );
};

export default AccountField;
