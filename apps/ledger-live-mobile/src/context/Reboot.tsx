import React, { Fragment, useContext, useCallback, useState } from "react";
import hoistNonReactStatic from "hoist-non-react-statics";
import { useCountervaluesPolling } from "@ledgerhq/live-countervalues-react";
import { clearDb } from "../db";

export type RebootFunc = (_?: boolean) => Promise<void>;
export const RebootContext = React.createContext<RebootFunc>(async () => {
  // empty function
});
export default function RebootProvider({
  children,
  onRebootStart,
  onRebootEnd,
}: {
  onRebootStart?: () => void;
  onRebootEnd?: () => void;
  children: React.ReactNode;
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
// NOTE: the comma is not a mistake, it's for TS to understand we
// are declaring a generic and not a JSX Element (due to .tsx file extension)
export const withReboot = <T,>(Cmp: React.ComponentType<T>) => {
  class WithReboot extends React.Component<Omit<T, "reboot">> {
    render() {
      return (
        <RebootContext.Consumer>
          {reboot => <Cmp reboot={reboot} {...(this.props as T)} />}
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
