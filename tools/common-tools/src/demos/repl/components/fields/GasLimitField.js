// @flow
import React, { useState } from "react";
import { BigNumber } from "bignumber.js";
import styled from "styled-components";

const Container = styled.div`
  position: relative;
`;

const Desc = styled.div`
  position: absolute;
  top: 0.5em;
  right: 1em;
  font-size: 16px;
  color: #ccc;
  pointer-event: none;
`;

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
  value: BigNumber,
  onChange: BigNumber => void,
  placeholder?: string,
  autoFocus?: boolean
};

const AmountField = ({ value, autoFocus, onChange }: Props) => {
  const formatted = value.toString();
  const initialText = value.isZero() ? "" : formatted;
  const [text, setText] = useState(initialText);

  return (
    <Container>
      <Input
        type="text"
        value={text}
        placeholder={formatted}
        autoFocus={autoFocus}
        onChange={e => {
          const r = BigNumber(e.target.value).integerValue();
          if (!value || !value.isEqualTo(r)) {
            onChange(r);
          }
          setText(value.toString());
        }}
      />
      <Desc>Gas limit</Desc>
    </Container>
  );
};

export default AmountField;
