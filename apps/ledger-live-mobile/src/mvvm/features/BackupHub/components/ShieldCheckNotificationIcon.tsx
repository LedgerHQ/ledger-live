import React, { type ComponentProps } from "react";
import { DotIndicator } from "@ledgerhq/lumen-ui-rnative";
import { ShieldCheck } from "@ledgerhq/lumen-ui-rnative/symbols";

export const RECOVER_NOTIFICATION_DOT_TEST_ID = "recover-notification-dot";

type ShieldCheckProps = ComponentProps<typeof ShieldCheck>;

export function ShieldCheckNotificationIcon({ size, style, color }: Readonly<ShieldCheckProps>) {
  return (
    <DotIndicator appearance="red" size="md" testID={RECOVER_NOTIFICATION_DOT_TEST_ID}>
      <ShieldCheck size={size} style={style} color={color} />
    </DotIndicator>
  );
}
