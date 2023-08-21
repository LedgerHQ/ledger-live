import React, { useCallback } from "react";
import { Link as UiLink } from "@ledgerhq/native-ui";
import { LinkProps } from "@ledgerhq/native-ui/components/cta/Link/index";
import { track } from "../../analytics";

export type WrappedLinkProps = LinkProps & {
  event?: string;
  eventProperties?: Record<string, unknown>;
};

export default function Link({
  onPress,
  event,
  eventProperties,
  ...othersProps
}: WrappedLinkProps) {
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

  return <UiLink onPress={onPressHandler} {...othersProps} />;
}
