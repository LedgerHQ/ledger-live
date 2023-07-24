import React, { useCallback } from "react";
import { ButtonProps } from "@ledgerhq/native-ui/components/cta/Button/index";
import { Button as UiButton } from "@ledgerhq/native-ui";
import { track } from "../../analytics";

export type WrappedButtonProps = ButtonProps & {
  event?: string;
  eventProperties?: unknown;
  buttonTestId?: string;
};

function Button({
  onPress,
  event,
  eventProperties,
  buttonTestId,
  ...othersProps
}: WrappedButtonProps) {
  const onPressHandler = useCallback(
    async pressEvent => {
      if (!onPress) return;
      if (event) {
        track(event, eventProperties as Record<string, unknown>);
      }
      onPress(pressEvent);
    },
    [event, eventProperties, onPress],
  );

  return <UiButton onPress={onPressHandler} {...othersProps} buttonTestId={buttonTestId} />;
}

export default Button;
