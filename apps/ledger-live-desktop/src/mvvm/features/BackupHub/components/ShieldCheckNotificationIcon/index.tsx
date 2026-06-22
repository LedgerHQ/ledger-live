import React, { type ComponentProps } from "react";
import { DotIndicator } from "@ledgerhq/lumen-ui-react";
import { ShieldCheck } from "@ledgerhq/lumen-ui-react/symbols";

export const RECOVER_NOTIFICATION_DOT_TEST_ID = "recover-notification-dot";

type ShieldCheckProps = Pick<ComponentProps<typeof ShieldCheck>, "size" | "className">;

export function ShieldCheckNotificationIcon({ size, className }: Readonly<ShieldCheckProps>) {
  return (
    <DotIndicator appearance="red" size="md" data-testid={RECOVER_NOTIFICATION_DOT_TEST_ID}>
      <ShieldCheck size={size} className={className} />
    </DotIndicator>
  );
}
