import React from "react";
import { Text } from "@ledgerhq/lumen-ui-rnative";

type NotificationsPromptContentProps = {
  readonly title: string;
  readonly description: string;
};

export const NotificationsPromptContent = ({
  title,
  description,
}: NotificationsPromptContentProps) => {
  return (
    <>
      <Text
        typography="heading4SemiBold"
        lx={{ color: "base", marginTop: "s20", textAlign: "center" }}
      >
        {title}
      </Text>

      <Text typography="body2" lx={{ color: "muted", marginTop: "s12", textAlign: "center" }}>
        {description}
      </Text>
    </>
  );
};
