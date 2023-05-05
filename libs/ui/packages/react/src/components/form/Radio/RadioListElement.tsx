import React, { InputHTMLAttributes, useContext } from "react";
import styled from "styled-components";
import Text from "../../asorted/Text";
import Flex, { FlexBoxProps } from "../../layout/Flex";
import { rgba } from "../../../styles/helpers";
import { RadioContext } from "./index";

type ElementState = {
  checked: boolean;
  disabled?: boolean | undefined;
};

export const Label = styled(Text)<ElementState>`
  color: ${(p) =>
    p.disabled
      ? p.theme.colors.neutral.c50
      : p.checked
      ? p.theme.colors.primary.c90
      : p.theme.colors.neutral.c100};
`;

const Container = styled(Flex)<ElementState>`
  cursor: ${(p) => (p.disabled ? "" : "pointer")};
  justify-content: center;
  align-items: center;
  background-color: ${(p) => (p.checked ? p.theme.colors.primary.c20 : "")};
  border: 1px solid ${(p) => (p.checked ? p.theme.colors.primary.c50 : p.theme.colors.neutral.c40)};
  border-radius: ${(p) => `${p.theme.radii[2]}px`};
  padding: ${(p) => p.theme.space[6]}px;

  :hover {
    border-color: ${(p) => (p.disabled || p.checked ? "" : p.theme.colors.primary.c80)};
  }
`;

const Input = styled.input`
  position: relative;
  appearance: none;
  &:focus ~ ${Container} {
    box-shadow: 0px 0px 0px 4px ${(p) => rgba(p.theme.colors.primary.c60, 0.48)};
  }
`;

const RadioListElement = styled.label.attrs({ tabIndex: -1 })`
  display: inline-flex;
  align-items: center;
`;

type InputAttributes = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange" | "name">;

export type RadioListElementProps = InputAttributes & {
  /**
   * The string or component that will be rendered as label of this radio element
   * If it's a component, it's rendered with these props: { checked:boolean; disabled:boolean }
   * */
  label: string | React.ComponentType<ElementState> | ((arg1: ElementState) => JSX.Element);
  /** Flex props to pass to the container */
  containerProps?: FlexBoxProps;
};

const ListElement = ({
  label,
  value,
  disabled,
  containerProps,
  ...props
}: RadioListElementProps): JSX.Element => {
  const context = useContext(RadioContext);
  if (context === undefined) throw new Error("RadioElement must be used within a RadioProvider");

  const isChecked = context.currentValue === value;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    context.onChange(event.target.value);
  };

  return (
    <RadioListElement>
      <Input
        type="radio"
        checked={isChecked}
        disabled={disabled}
        onChange={handleChange}
        value={value}
        name={context.name}
        {...props}
      />
      <Container checked={isChecked} disabled={disabled} {...containerProps}>
        {typeof label === "string" ? (
          <Label checked={isChecked} disabled={disabled} variant="paragraph">
            {label}
          </Label>
        ) : (
          React.createElement(label, { checked: isChecked, disabled })
        )}
      </Container>
    </RadioListElement>
  );
};

ListElement.displayName = "Radio.ListElement"; // For easy identification in the React devtools & in storybook
ListElement.Label = Label;

export default ListElement;
