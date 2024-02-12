import React from "react";
import { Button as BaseButton, InvertTheme } from "@ledgerhq/react-ui";
import { ButtonProps as BaseButtonProps } from "@ledgerhq/react-ui/components/cta/Button";
import { useTrack } from "~/renderer/analytics/segment";
import styled from "styled-components";

export const Base = styled(BaseButton)<{ big?: boolean }>`
  border-radius: 44px;

  font-size: ${p => (p.big ? "14px" : "12px")};
  height: 40px;
  line-height: 40px;
  padding: 0 24px;

  ${p =>
    p.variant === "shade"
      ? `background-color: transparent!important;border-color: currentColor;`
      : ``}
`;

export type Props = BaseButtonProps & {
  inverted?: boolean;
  disabled?: boolean;
  isLoading?: boolean;
  event?: string;
  eventProperties?: Record<string, unknown>;
  buttonTestId?: string;
  big?: boolean;
};

function Button({
  onClick,
  inverted,
  disabled,
  children,
  isLoading,
  event,
  eventProperties,
  buttonTestId,
  ...rest
}: Props) {
  const track = useTrack();
  const isClickDisabled = disabled || isLoading;
  const onClickHandler = (e: React.SyntheticEvent<HTMLButtonElement, Event>) => {
    if (onClick) {
      if (event) {
        track(event, eventProperties || {});
      }
      onClick(e);
    }
  };
  const inner = (
    <Base
      {...rest}
      disabled={disabled}
      onClick={isClickDisabled ? undefined : onClickHandler}
      data-test-id={buttonTestId}
    >
      {children}
    </Base>
  );
  return inverted ? <InvertTheme>{inner} </InvertTheme> : inner;
}

export default React.memo(Button);
