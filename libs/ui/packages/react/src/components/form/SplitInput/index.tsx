import React, { useCallback } from "react";
import type { JSX } from "react";
import styled from "styled-components";
import { DefaultTheme } from "styled-components";
import {
  InputContainer as BaseInputContainer,
  InputErrorContainer,
  InputContainerStyleProps,
} from "../BaseInput";

// Cast to avoid styled-components type inference issues with React 19
const InputContainer = BaseInputContainer as React.ComponentType<
  InputContainerStyleProps & { children?: React.ReactNode }
>;
// Keep original for CSS selectors
const InputContainerSelector = BaseInputContainer;

type Callbacks = {
  onFocus: <F>(event: React.FocusEvent<F>) => void;
  onBlur: <B>(event: React.FocusEvent<B>) => void;
};
type ExtraRenderProps = {
  renderLeft: (p: StateProps & Callbacks) => React.ReactNode;
  renderRight: (p: StateProps & Callbacks) => React.ReactNode;
};
export type StateProps = {
  error?: string | undefined;
  disabled?: boolean;
  isDisabled?: boolean;
};
export type Props = StateProps & ExtraRenderProps;
type DividerProps = {
  disabled: boolean | undefined;
  focus: boolean | undefined;
  error: string | undefined;
  theme?: DefaultTheme;
};
function getDividerColor(props: DividerProps) {
  if (props.disabled) {
    return props.theme?.colors.neutral.c40;
  }
  if (props.error) {
    return props.theme?.colors.error.c50;
  }
  if (props.focus) {
    return props.theme?.colors.primary.c80;
  }

  return props.theme?.colors.neutral.c40;
}

function getHoverBolderColor(props: DividerProps) {
  return props.disabled || props.error ? "inherit" : props.theme?.colors.primary.c80;
}

type DividerStyleProps = {
  disabled: boolean | undefined;
  focus: boolean | undefined;
  error: string | undefined;
};

const StyledDivider = styled.div<DividerStyleProps>`
  border-right: 1px solid;
  height: 100%;
  transition: border-color 0.2s ease;

  border-color: ${getDividerColor};
  ${InputContainerSelector}:hover & {
    border-color: ${getHoverBolderColor};
  }
`;

// Cast to avoid styled-components type inference issues with React 19
const Divider = StyledDivider as React.ComponentType<DividerStyleProps>;

export default function SplitInput(props: Props): JSX.Element {
  const { disabled, isDisabled, renderLeft, renderRight, error } = props;
  const [focus, setFocus] = React.useState(false);

  const onFocus = useCallback(() => {
    setFocus(true);
  }, [setFocus]);
  const onBlur = useCallback(() => {
    setFocus(false);
  }, [setFocus]);

  const disabledState = typeof disabled !== "undefined" ? disabled : isDisabled;

  return (
    <div>
      <InputContainer disabled={disabledState} focus={focus} error={error}>
        <div style={{ width: "50%", height: "100%" }}>
          {renderLeft({
            error,
            onFocus,
            onBlur,
            disabled: disabledState,
            isDisabled: disabledState,
          })}
        </div>
        <Divider focus={focus} disabled={disabled} error={error} />
        <div style={{ width: "50%", height: "100%" }}>
          {typeof renderRight === "function"
            ? renderRight({
                error,
                onFocus,
                onBlur,
                disabled: disabledState,
                isDisabled: disabledState,
              })
            : renderRight}
        </div>
      </InputContainer>
      {error && !disabled && <InputErrorContainer>{error}</InputErrorContainer>}
    </div>
  );
}
