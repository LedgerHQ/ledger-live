import React, { useCallback } from "react";
import { ButtonProps } from "@ledgerhq/native-ui/components/cta/Button";
import { Button as UiButton } from "@ledgerhq/native-ui";
import { track } from "../../analytics";

export type WrappedButtonProps = ButtonProps & {
  event?: string;
  // eslint-disable-next-line @typescript-eslint/ban-types
  eventProperties?: Object;
};

function Button({
  onPress,
  event,
  eventProperties,
  ...othersProps
}: WrappedButtonProps) {
  const onPressHandler = useCallback(
    async pressEvent => {
      if (!onPress) return;
      if (event) {
        track(event, eventProperties);
      }
      onPress(pressEvent);
    },
    [event, eventProperties, onPress],
  );

  return <UiButton onPress={onPressHandler} {...othersProps} />;
}

export default Button;
