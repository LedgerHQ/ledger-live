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

export type DataTypeAscii = {
  type: "ascii",
  minlength?: number,
  maxlength?: number,
  default: string
};

type Props = {
  value: string,
  onChange: string => void,
  placeholder?: string,
  autoFocus?: boolean
};

const AsciiField = ({ value, onChange, placeholder, autoFocus }: Props) => {
  return (
    <Input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      autoFocus={autoFocus}
      placeholder={placeholder}
    />
  );
};

export default AsciiField;
