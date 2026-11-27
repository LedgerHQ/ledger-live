import React from "react";
import { Text } from "@ledgerhq/lumen-ui-rnative";
import type { IncidentDescriptionProps } from "./IncidentDescription.types";

export function IncidentDescription({ parts }: IncidentDescriptionProps) {
  return parts.map(part =>
    part.onPress ? (
      <Text
        key={part.text}
        typography="body2"
        lx={{ color: "base", textDecorationLine: "underline" }}
        accessibilityRole="link"
        onPress={part.onPress}
      >
        {part.text}
      </Text>
    ) : (
      <React.Fragment key={part.text}>{part.text}</React.Fragment>
    ),
  );
}
