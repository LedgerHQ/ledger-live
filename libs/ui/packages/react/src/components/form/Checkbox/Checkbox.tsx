import React from "react";
import styled from "styled-components";
import Text from "../../asorted/Text";
import CheckAloneMedium from "@ledgerhq/icons-ui/reactLegacy/CheckAloneMedium";
import { renderToStaticMarkup } from "react-dom/server";

const Icon = () =>
  React.cloneElement(CheckAloneMedium({ size: 13, color: "currentColor" }), {
    // the xmlns attribute is required to properly display the checkbox
    xmlns: "http://www.w3.org/2000/svg",
  });
const CheckMarkIcon = encodeURIComponent(renderToStaticMarkup(<Icon />));

const Input = styled.input<{ size?: number }>`
  background-color: transparent;

  border-radius: ${p => `${p.theme.radii[1]}px`};
  position: relative;

  min-width: ${p => (p.size ? `${p.size}px` : `${p.theme.space[7]}px`)};
  height: ${p => (p.size ? `${p.size}px` : `${p.theme.space[7]}px`)};
  appearance: none;
  border: 1px solid ${props => props.theme.colors.opacityDefault.c30};
  box-shadow: none;

  &:checked {
    background-color: currentColor;
    border-color: currentColor;
  }

  &:checked::after {
    content: " ";
    width: ${p => (p.size ? `${p.size}px` : `${p.theme.space[7]}px`)};
    height: ${p => (p.size ? `${p.size}px` : `${p.theme.space[7]}px`)};
    display: inline-block;
    color: ${props => props.theme.colors.neutral.c00};

    background-image: url("data:image/svg+xml,${CheckMarkIcon}");
    background-position: center;
    background-repeat: no-repeat;

    /* Trick to center the check mark by taking into account the border */
    position: absolute;
    top: -1px;
    left: -1px;
  }
`;

const Label = styled(Text).attrs({ type: "body", fontWeight: "500" })`
  color: ${props => props.theme.colors.neutral.c80};

  /* Version when the input is checked */
  ${Input}:checked + & {
    color: currentColor;
  }

  &:first-letter {
    text-transform: uppercase;
  }
`;

const Container = styled.div`
  --ll-checkbox-color: unset;
  color: var(--ll-checkbox-color, ${props => props.theme.colors.primary.c90});

  display: inline-flex;
  column-gap: ${p => p.theme.space[5]}px;
  align-items: center;
  cursor: pointer;

  &[data-variant="default"] {
    --ll-checkbox-color: ${props => props.theme.colors.primary.c90};
  }

  &[data-variant="success"] {
    --ll-checkbox-color: ${props => props.theme.colors.success.c50};
  }

  &[data-variant="error"] {
    --ll-checkbox-color: ${props => props.theme.colors.error.c50};
  }

  &[data-disabled="true"] {
    --ll-checkbox-color: ${props => props.theme.colors.neutral.c80};
    cursor: unset;
  }
`;

export type CheckboxProps = {
  isDisabled?: boolean;
  isChecked: boolean;
  variant?: "default" | "success" | "error";
  label?: React.ReactNode;
  name: string;
  onChange: (value: boolean) => void;
  size?: number;
};

const Checkbox = ({
  isDisabled = false,
  variant = "default",
  label,
  isChecked,
  name,
  onChange,
  size,
}: CheckboxProps): JSX.Element => (
  <Container data-variant={variant} data-disabled={isDisabled}>
    <Input
      type="checkbox"
      name={name}
      id={name}
      checked={isChecked}
      disabled={isDisabled}
      onChange={() => onChange(!isChecked)}
      size={size}
    />
    {label ? (
      <Label as="label" htmlFor={name}>
        {label}
      </Label>
    ) : null}
  </Container>
);

export default Checkbox;
