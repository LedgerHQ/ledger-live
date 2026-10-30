import React, { type ComponentProps } from "react";
import { DotIndicator } from "@ledgerhq/lumen-ui-rnative";
import { Bell } from "@ledgerhq/lumen-ui-rnative/symbols";

export const BELL_NOTIFICATION_DOT_TEST_ID = "bell-notification-dot";

type BellProps = ComponentProps<typeof Bell>;

export function BellNotificationIcon({ size, style, color }: Readonly<BellProps>) {
  return (
    <DotIndicator appearance="red" size="md" testID={BELL_NOTIFICATION_DOT_TEST_ID}>
      <Bell size={size} style={style} color={color} />
    </DotIndicator>
  );
}
