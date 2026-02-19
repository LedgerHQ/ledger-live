import React from "react";
import styled from "styled-components";
import CheckAloneMedium from "@ledgerhq/icons-ui/reactLegacy/CheckAloneMedium";
import { renderToStaticMarkup } from "react-dom/server";
import { withTokens } from "../../libs";

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

const Container = styled.div`
  ${withTokens("colors-background-active")}

  color: var(--colors-background-active);

  display: inline-flex;
  column-gap: ${p => p.theme.space[5]}px;
  align-items: center;
  cursor: pointer;
`;

export type CheckboxProps = {
  isDisabled?: boolean;
  isChecked: boolean;
  name: string;
  onChange: (value: boolean) => void;
  size?: number;
};

export const Checkbox = ({
  isDisabled = false,
  isChecked,
  name,
  onChange,
  size,
}: CheckboxProps): React.JSX.Element => (
  <Container data-disabled={isDisabled}>
    <Input
      type="checkbox"
      name={name}
      id={name}
      checked={isChecked}
      disabled={isDisabled}
      onChange={e => {
        // TODO Checkbox should be an uncontrolled component that exposes the event onChange.
        // (leave stopPropagation to the parent)
        e.stopPropagation();
        onChange(!isChecked);
      }}
      size={size}
    />
  </Container>
);
