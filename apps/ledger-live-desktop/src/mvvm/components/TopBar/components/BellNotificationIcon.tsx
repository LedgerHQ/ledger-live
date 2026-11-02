import React, { type ComponentProps } from "react";
import { DotIndicator } from "@ledgerhq/lumen-ui-react";
import { Bell } from "@ledgerhq/lumen-ui-react/symbols";

export const BELL_NOTIFICATION_DOT_TEST_ID = "bell-notification-dot";

type BellProps = Pick<ComponentProps<typeof Bell>, "size" | "className">;

export function BellNotificationIcon({ size, className }: Readonly<BellProps>) {
  return (
    <DotIndicator appearance="red" size="md" data-testid={BELL_NOTIFICATION_DOT_TEST_ID}>
      <Bell size={size} className={className} />
    </DotIndicator>
  );
}
