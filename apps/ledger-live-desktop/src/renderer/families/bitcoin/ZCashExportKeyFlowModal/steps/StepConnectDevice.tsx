import React, { useMemo } from "react";
import { getMainAccount } from "@ledgerhq/live-common/account/helpers";
import DeviceAction from "~/renderer/components/DeviceAction";
import type { StepProps } from "../types";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";
import useConnectAppAction from "~/renderer/hooks/useConnectAppAction";

export default function StepConnectDevice({ account, transitionTo }: StepProps) {
  const mainAccount = account ? getMainAccount(account) : null;
  const action = useConnectAppAction();
  const request = useMemo(
    () => ({
      account: mainAccount || undefined,
    }),
    [mainAccount],
  );

  return (
    <>
      <DeviceAction
        action={action}
        request={request}
        onResult={() => transitionTo("export")}
        analyticsPropertyFlow="exportUfvk"
        location={HOOKS_TRACKING_LOCATIONS.receiveModal}
      />
    </>
  );
}
