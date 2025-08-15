import { useCountervaluesWipeIfAvailable } from "@ledgerhq/live-countervalues-react";
import hoistNonReactStatic from "hoist-non-react-statics";
import React, { Fragment, useCallback, useContext } from "react";
import { useSelector, useDispatch } from "react-redux";
import { clearDb } from "../db";
import { incrementRebootId } from "../actions/appstate";
import { rebootIdSelector } from "../reducers/appstate";

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
  const rebootId = useSelector(rebootIdSelector);
  const dispatch = useDispatch();
  const wipe = useCountervaluesWipeIfAvailable();
  const reboot: RebootFunc = useCallback(
    async (resetData = false) => {
      if (onRebootStart) onRebootStart();
      dispatch(incrementRebootId());

      if (resetData) {
        wipe();
        await clearDb();
      }

      if (onRebootEnd) onRebootEnd();
    },
    [wipe, onRebootStart, onRebootEnd, dispatch],
  );
  return (
    <RebootContext.Provider value={reboot}>
      <Fragment key={rebootId}>{children}</Fragment>
    </RebootContext.Provider>
  );
}
export const withReboot = <P extends object>(
  Component: React.ComponentType<P & { reboot: RebootFunc }>,
): React.ComponentType<P> => {
  const WrappedComponent = (props: P) => {
    const reboot = useReboot();
    return <Component {...props} reboot={reboot} />;
  };

  hoistNonReactStatic(WrappedComponent, Component);

  return WrappedComponent;
};

export function useReboot() {
  return useContext(RebootContext);
}
