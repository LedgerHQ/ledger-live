import React, { useState } from "react";
import { BigNumber } from "bignumber.js";
import styled from "styled-components";
import {
  formatCurrencyUnit,
  sanitizeValueString,
} from "@ledgerhq/live-common/lib/currencies/index";
import type { Unit } from "@ledgerhq/types-cryptoassets";

const Container = styled.div`
  position: relative;
`;

const Code = styled.div`
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
  unit: Unit;
  value: BigNumber;
  onChange: (n: BigNumber) => void;
  placeholder?: string;
  autoFocus?: boolean;
};

const AmountField = ({ unit, value, autoFocus, onChange }: Props) => {
  const [isFocused, setFocused] = useState(autoFocus);
  const formatted = formatCurrencyUnit(unit, value, {
    useGrouping: !isFocused,
    disableRounding: true,
  });
  const initialText = value.isZero() ? "" : formatted;
  const [text, setText] = useState(initialText);

  return (
    <Container>
      <Input
        type="text"
        value={text}
        placeholder={formatted}
        autoFocus={autoFocus}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          setText(initialText);
        }}
        onChange={e => {
          const r = sanitizeValueString(unit, e.target.value);
          const satoshiValue = BigNumber(r.value);
          if (!value || !value.isEqualTo(satoshiValue)) {
            onChange(satoshiValue);
          }
          setText(r.display);
        }}
      />
      <Code>{unit.code}</Code>
    </Container>
  );
};

export default AmountField;
