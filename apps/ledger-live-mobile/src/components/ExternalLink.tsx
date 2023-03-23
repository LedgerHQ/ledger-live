import React, { useCallback } from "react";
import { Icons, Link as BaseLink } from "@ledgerhq/native-ui";
import { LinkProps } from "@ledgerhq/native-ui/components/cta/Link/index";
import { track } from "../analytics";

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
    nativeEvent => {
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
      Icon={Icon || Icons.ExternalLinkMedium}
      iconPosition={iconPosition || (iconFirst ? "left" : "right")}
      onPress={handlePress}
    >
      {text}
    </BaseLink>
  );
}
