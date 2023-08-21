import React from "react";
import styled from "styled-components";
import Text from "../../asorted/Text";
import Flex from "../../layout/Flex";

const Container = styled(Flex).attrs({ alignItems: "center", flexDirection: "row" })`
  width: fit-content;
  column-gap: ${p => p.theme.space[5]}px;
  cursor: pointer;

  /* reversed VARIANT */
  &[data-reversed="true"] {
    flex-direction: row-reverse;
  }

  &[data-disabled="true"] {
    cursor: unset;
  }
`;

const Input = styled.input`
  position: absolute;
  visibility: hidden;
`;

const Label = styled(Text)`
  &:first-letter {
    text-transform: uppercase;
  }
`;

const Switcher = styled.div`
  --ll-switch-width: ${p => p.theme.space[14]}px;
  --ll-switch-height: ${p => p.theme.space[9]}px;
  --ll-switch-padding: ${p => p.theme.space[2]}px;

  position: relative;
  display: inline-block;

  background: ${props => props.theme.colors.neutral.c60};
  border-radius: ${p => p.theme.space[6]}px;
  width: var(--ll-switch-width);
  height: var(--ll-switch-height);

  transition: background 200ms;

  &:before,
  &:after {
    content: "";
  }

  &:focus {
    outline-style: auto;
    outline: 1px solid ${props => props.theme.colors.neutral.c90};
    outline-offset: ${p => p.theme.space[1]}px;
  }

  /* CIRCLE ELEMENT */
  &:before {
    position: absolute;
    display: block;
    background: ${props => props.theme.colors.constant.white};
    border-radius: ${p => p.theme.space[12]}px;

    width: calc(calc(var(--ll-switch-width) / 2) - var(--ll-switch-padding));
    height: calc(calc(var(--ll-switch-width) / 2) - var(--ll-switch-padding));
    top: var(--ll-switch-padding);
    transform: translateX(var(--ll-switch-padding));
    transition: transform 0.25s;
  }

  /* SMALL VARIANT */
  &[data-size="small"] {
    --ll-switch-width: ${p => p.theme.space[8]}px;
    --ll-switch-height: ${p => p.theme.space[6]}px;
  }

  &:hover {
    background-color: ${props => props.theme.colors.neutral.c70};
  }

  &:active {
    background-color: ${props => props.theme.colors.neutral.c80};
  }

  /* CHECKED VARIANT */
  ${Input}:checked ~ & {
    background: ${props => props.theme.colors.primary.c80};

    &:before {
      transform: translateX(calc(var(--ll-switch-width) / 2));
    }

    &:hover {
      background: ${props => props.theme.colors.primary.c90};
    }

    :active {
      background: ${props => props.theme.colors.primary.c100};
    }
  }
`;

export type SwitchProps = {
  name: string;
  checked: boolean;
  onChange: (e: React.FormEvent<HTMLDivElement>) => void;
  size?: "normal" | "small";
  label?: string;
  disabled?: boolean;
  reversed?: boolean;
};

const Switch = ({
  name,
  checked,
  onChange,
  label,
  disabled,
  reversed,
  size,
}: SwitchProps): JSX.Element => {
  const handleFocusKeyDown = (e: React.FormEvent<HTMLDivElement> & { key: string }) => {
    if (e.key.match(/enter/i)) onChange(e);
  };

  const handleClick = (e: React.FormEvent<HTMLDivElement>) => {
    if (!disabled) onChange(e);
  };

  return (
    <Container
      role="button"
      data-reversed={reversed}
      data-disabled={disabled}
      onClick={handleClick}
      tabIndex={0}
      aria-pressed={checked}
      onKeyDown={handleFocusKeyDown}
    >
      <Input type="checkbox" name={name} id={name} disabled={disabled} checked={checked} />
      <Switcher data-size={size} />
      {label ? <Label variant="paragraph">{label}</Label> : null}
    </Container>
  );
};

export default Switch;
