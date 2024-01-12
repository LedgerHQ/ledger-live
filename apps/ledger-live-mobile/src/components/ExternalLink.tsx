import React, { useCallback } from "react";
import { IconsLegacy, Link as BaseLink } from "@ledgerhq/native-ui";
import { LinkProps } from "@ledgerhq/native-ui/components/cta/Link/index";
import { track } from "~/analytics";
import { GestureResponderEvent } from "react-native-modal";

type Props = {
  disabled?: boolean;
  event?: string;
  eventProperties?: Record<string, unknown>;
  Icon?: React.ComponentType<{ color: string; size: number }>;
  /** deprecated, use `iconPosition` instead */
  iconFirst?: boolean;
  iconPosition?: LinkProps["iconPosition"];
  onPress?: LinkProps["onPress"];
  text: LinkProps["children"];
  type?: LinkProps["type"];
};

export default function ExternalLink({
  disabled,
  event,
  eventProperties,
  Icon,
  iconFirst,
  iconPosition,
  onPress,
  text,
  type,
}: Props) {
  const handlePress = useCallback(
    (nativeEvent: GestureResponderEvent) => {
      if (event) {
        track(event, ...(eventProperties ? [eventProperties] : []));
      }
      onPress && onPress(nativeEvent);
    },
    [event, eventProperties, onPress],
  );

  return (
    <BaseLink
      disabled={disabled}
      type={type || "color"}
      Icon={Icon || IconsLegacy.ExternalLinkMedium}
      iconPosition={iconPosition || (iconFirst ? "left" : "right")}
      onPress={handlePress}
    >
      {text}
    </BaseLink>
  );
}
