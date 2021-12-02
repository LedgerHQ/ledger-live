import React, { InputHTMLAttributes, useContext, useMemo } from "react";
import styled from "styled-components";

import { rgba } from "../../../styles/helpers";
import Text from "../../asorted/Text";
import { RadioContext } from "./index";

const Label = styled(Text)`
  color: var(--ledger-ui-checkbox-color, ${(p) => p.theme.colors.neutral.c100});
`;

const Input = styled.input`
  --ledger-ui-checkbox-color: ${(p) => p.theme.colors.neutral.c50};
  --ledger-ui-checkbox-size: 1.25rem;

  position: relative;
  appearance: none;
  width: var(--ledger-ui-checkbox-size);
  height: var(--ledger-ui-checkbox-size);
  border-radius: ${(p) => `${p.theme.radii[1]}px`};
  border: 1px solid var(--ledger-ui-checkbox-color);
  cursor: pointer;

  &:checked::before {
    position: absolute;
    display: block;
    content: " ";
    background-color: var(--ledger-ui-checkbox-color);
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    margin: auto;
    border-radius: 2px;
    width: calc(var(--ledger-ui-checkbox-size) / 2);
    height: calc(var(--ledger-ui-checkbox-size) / 2);
  }

  &[data-variant="default"] {
    :hover {
      --ledger-ui-checkbox-color: ${(p) => p.theme.colors.primary.c90};
    }
    :active {
      --ledger-ui-checkbox-color: ${(p) => p.theme.colors.primary.c100};
    }
    :checked,
    :focus {
      --ledger-ui-checkbox-color: ${(p) => p.theme.colors.primary.c80};
    }
    :focus {
      box-shadow: 0px 0px 0px 4px ${(p) => rgba(p.theme.colors.primary.c60, 0.48)};
    }
  }

  &[data-variant="main"] {
    :hover {
      --ledger-ui-checkbox-color: ${(p) => p.theme.colors.neutral.c90};
    }
    :active {
      --ledger-ui-checkbox-color: ${(p) => p.theme.colors.neutral.c100};
    }
    :checked,
    :focus {
      --ledger-ui-checkbox-color: ${(p) => p.theme.colors.neutral.c100};
    }
    :focus {
      box-shadow: 0px 0px 0px 4px ${(p) => rgba(p.theme.colors.neutral.c60, 0.48)};
    }
  }

  &[data-variant="success"] {
    :hover,
    :checked:not([disabled]),
    :checked:not([disabled]) + ${Label}, :focus {
      --ledger-ui-checkbox-color: ${(p) => p.theme.colors.success.c100};
    }
    :focus {
      box-shadow: 0px 0px 0px 4px ${(p) => rgba(p.theme.colors.success.c100, 0.48)};
    }
  }

  &[data-variant="error"] {
    :hover,
    :checked:not([disabled]),
    :checked:not([disabled]) + ${Label}, :focus {
      --ledger-ui-checkbox-color: ${(p) => p.theme.colors.error.c100};
    }
    :focus {
      box-shadow: 0px 0px 0px 4px ${(p) => rgba(p.theme.colors.error.c100, 0.48)};
    }
  }

  &[data-variant]:disabled {
    --ledger-ui-checkbox-color: ${(p) => p.theme.colors.neutral.c40};
    cursor: unset;
    background-color: ${(p) => p.theme.colors.neutral.c30};
  }
`;

const RadioElement = styled.label.attrs({ tabIndex: -1 })`
  display: inline-flex;
  column-gap: 0.75rem;
  align-items: center;
`;

type InputAttributes = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange" | "name">;

export type RadioElementProps = InputAttributes & {
  variant?: "default" | "main" | "success" | "error";
  label: string;
};

const Element = ({
  label,
  value,
  disabled,
  variant = "default",
  ...props
}: RadioElementProps): JSX.Element => {
  const context = useContext(RadioContext);
  if (context === undefined) throw new Error("RadioElement must be used within a RadioProvider");

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const isChecked = useMemo(() => context.currentValue === value, [context.currentValue]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    context.onChange(event.target.value);
  };

  return (
    <RadioElement>
      <Input
        type="radio"
        data-variant={variant}
        checked={isChecked}
        disabled={disabled}
        onChange={handleChange}
        value={value}
        name={context.name}
        {...props}
      />
      <Label variant="paragraph">{label}</Label>
    </RadioElement>
  );
};

Element.displayName = "Radio.Element"; // For easy identification in the React devtools & in storybook

export default Element;
