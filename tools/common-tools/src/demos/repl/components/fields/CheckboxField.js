// @flow
import React from "react";
import styled from "styled-components";

const Row = styled.div`
  display: flex;
  flex-direction: row;
`;

const Input = styled.input`
  outline: none;
`;

export type DataTypeCheckbox = {
  type: "checkbox",
  default: boolean,
  label: string
};

type Props = {
  value: boolean,
  onChange: boolean => void,
  autoFocus?: boolean,
  label: string
};

const AsciiField = ({ value, onChange, autoFocus, label }: Props) => {
  return (
    <Row>
      <Input
        type="checkbox"
        value={value}
        onChange={e => onChange(e.target.checked)}
        autoFocus={autoFocus}
      />
      {" "}
      <div>{label}</div>
    </Row>
  );
};

export default AsciiField;
