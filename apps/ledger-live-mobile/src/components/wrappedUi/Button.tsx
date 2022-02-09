import React, { useCallback } from "react";
import { ButtonProps } from "@ledgerhq/native-ui/components/cta/Button";
import { Button as UiButton } from "@ledgerhq/native-ui";
import { track } from "../../analytics";

export type WrapperButtonProps = ButtonProps & {
  event?: string;
  eventProperties?: Object;
};

export default function Button({
  onPress,
  event,
  eventProperties,
  ...othersProps
}: WrapperButtonProps) {
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
