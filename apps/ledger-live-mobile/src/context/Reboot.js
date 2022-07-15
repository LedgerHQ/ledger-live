// @flow
import React, { Fragment, useContext, useCallback, useState } from "react";
import hoistNonReactStatic from "hoist-non-react-statics";
import { useCountervaluesPolling } from "@ledgerhq/live-common/countervalues/react";
import { clearDb } from "../db";

type RebootFunc = (resetData?: boolean) => Promise<void>;

export const RebootContext = React.createContext<RebootFunc>(async () => {});

export default function RebootProvider({
  children,
  onRebootStart,
  onRebootEnd,
}: {
  onRebootStart?: () => void,
  onRebootEnd?: () => void,
  children: React$Node,
}) {
  const [rebootId, setRebootId] = useState(0);
  const { wipe } = useCountervaluesPolling();

  const reboot: RebootFunc = useCallback(
    async (resetData = false) => {
      if (onRebootStart) onRebootStart();
      setRebootId(id => id + 1);
      if (resetData) {
        wipe();
        await clearDb();
      }
      if (onRebootEnd) onRebootEnd();
    },
    [wipe, onRebootStart, onRebootEnd],
  );

  return (
    <RebootContext.Provider value={reboot}>
      <Fragment key={rebootId}>{children}</Fragment>
    </RebootContext.Provider>
  );
}

// TODO improve flow types
export const withReboot = (Cmp: *) => {
  class WithReboot extends React.Component<*> {
    render() {
      return (
        <RebootContext.Consumer>
          {reboot => <Cmp reboot={reboot} {...this.props} />}
        </RebootContext.Consumer>
      );
    }
  }
  hoistNonReactStatic(WithReboot, Cmp);
  return WithReboot;
};

export function useReboot() {
  return useContext(RebootContext);
}
