import React from "react";
import noop from "lodash/noop";
import styled from "styled-components";
import { Tabbable } from "~/renderer/components/Box";

type BaseProps = {
  forceBgColor?: string;
  isChecked?: boolean;
  small?: boolean;
  medium?: boolean;
  disabled?: boolean;
};

const Base = styled(Tabbable).attrs<BaseProps>(p => ({
  bg: p.forceBgColor ? p.forceBgColor : p.isChecked ? "wallet" : "palette.text.shade10",
  horizontal: true,
  alignItems: "center",
}))<BaseProps>`
  & input[type="checkbox"] {
    display: none;
  }
  width: ${p => (p.small ? 25 : p.medium ? 37.5 : 40)}px;
  height: ${p => (p.small ? 13 : p.medium ? 18.5 : 24)}px;
  border-radius: 13px;
  opacity: ${p => (p.disabled ? 0.3 : 1)};
  transition: 250ms linear background-color;
  cursor: ${p => (p.disabled ? "cursor" : "pointer")};
  &:focus {
    outline: none;
  }
`;

type BallProps = {
  isChecked?: boolean;
  small?: boolean;
  medium?: boolean;
};

const Ball = styled.div<BallProps>`
  width: ${p => (p.small ? 9 : p.medium ? 14 : 20)}px;
  height: ${p => (p.small ? 9 : p.medium ? 14.5 : 20)}px;
  border-radius: 50%;
  background: ${p => p.theme.colors?.palette.primary.contrastText};
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.2);
  transition: 250ms ease-in-out transform;
  transform: translate3d(
    ${p =>
      p.small
        ? p.isChecked
          ? "14px"
          : "2px"
        : p.medium
          ? p.isChecked
            ? "21px"
            : "2px"
          : p.isChecked
            ? "18px"
            : "2px"},
    0,
    0
  );
`;

type Props = {
  isChecked: boolean;
  disabled?: boolean;
  onChange?: (a: boolean) => void;
  small?: boolean;
  medium?: boolean;
  forceBgColor?: string;
};

export default function Switch({
  isChecked,
  onChange = noop,
  small,
  medium,
  disabled,
  forceBgColor,
  ...p
}: Props) {
  return (
    <Base
      {...p}
      key={isChecked ? "ON" : "OFF"}
      disabled={disabled}
      small={small}
      medium={medium}
      isChecked={isChecked}
      onClick={() => {
        if (!disabled) {
          onChange(!isChecked);
        }
      }}
      className="switch"
      forceBgColor={forceBgColor}
    >
      <input type="checkbox" disabled={disabled || false} checked={isChecked} readOnly />
      <Ball small={small} medium={medium} isChecked={isChecked} />
    </Base>
  );
}
