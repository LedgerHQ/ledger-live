import React, { useCallback } from "react";
import styled from "styled-components";
import { Text } from "@ledgerhq/react-ui";
import Check from "~/renderer/icons/Check";
import { Tabbable } from "~/renderer/components/Box";
const Container = styled.div`
  display: inline-flex;
  column-gap: ${p => p.theme.space[5]}px;
  align-items: center;
  cursor: pointer;
`;
const Label = styled(Text).attrs({
  type: "body",
  fontWeight: "500",
})`
  color: ${props => props.theme.colors.neutral.c80};

  &:first-letter {
    text-transform: uppercase;
  }
`;
const Base = styled(Tabbable).attrs(() => ({
  relative: true,
  alignItems: "center",
  justifyContent: "center",
}))<{
  isChecked?: boolean;
  isRadio?: boolean;
  inverted?: boolean;
}>`
  & input[type="checkbox"] {
    display: none;
  }
  outline: none;
  border-radius: ${p => (p.isRadio ? 24 : 4)}px;
  cursor: pointer;
  background-color: ${p =>
    p.isChecked
      ? p.inverted
        ? p.theme.colors.neutral.c00
        : p.theme.colors.primary.c80
      : "rgba(0,0,0,0)"};
  border: 1px solid
    ${p =>
      p.isChecked
        ? p.theme.colors.primary.c80
        : p.inverted
          ? p.theme.colors.neutral.c00
          : p.theme.colors.neutral.c70};
  color: ${p =>
    p.isChecked
      ? p.inverted
        ? p.theme.colors.primary.c80
        : p.theme.colors.neutral.c00
      : "rgba(0,0,0,0)"};
  height: ${p => (p.isRadio ? 24 : 18)}px;
  width: ${p => (p.isRadio ? 24 : 18)}px;
  transition: all ease-in-out 0.1s;
  &:focus {
    box-shadow: 0 0 4px 1px
      ${p => (p.inverted ? p.theme.colors.neutral.c00 : p.theme.colors.primary.c80)};
    border-color: ${p => (p.inverted ? p.theme.colors.neutral.c00 : p.theme.colors.primary.c80)};
  }
  &:hover {
    border-color: ${p => (p.inverted ? p.theme.colors.neutral.c00 : p.theme.colors.primary.c80)};
  }
  ${p => (p.disabled ? `pointer-events: none; cursor: default;` : "")}
`;
type Props = {
  isChecked: boolean;
  onChange?: (isChecked: boolean) => void;
  isRadio?: boolean;
  disabled?: boolean;
  inverted?: boolean;
  label?: string;
};
function CheckBox({ label, ...props }: Props) {
  const { isChecked, onChange, isRadio, disabled } = props;
  const onClick = useCallback(
    (e: React.SyntheticEvent) => {
      if (!onChange) return;
      e.stopPropagation();
      onChange(isChecked);
    },
    [onChange, isChecked],
  );
  return (
    <Container>
      <Base
        {...props}
        isRadio={isRadio}
        isChecked={isChecked}
        disabled={disabled}
        onClick={onClick}
      >
        <input
          type="checkbox"
          disabled={disabled || false}
          checked={typeof isChecked === "boolean" ? isChecked : false}
          onChange={onClick}
        />
        <Check size={12} />
      </Base>
      {label ? <Label>{label}</Label> : null}
    </Container>
  );
}
export default CheckBox;
