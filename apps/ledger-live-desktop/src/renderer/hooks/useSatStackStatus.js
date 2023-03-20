// @flow
import { statusObservable } from "@ledgerhq/live-common/families/bitcoin/satstack";
import { useObservable } from "@ledgerhq/live-common/observable";
import type { SatStackStatus } from "@ledgerhq/live-common/families/bitcoin/satstack";

let lastState;
const useSatStackStatus = (): ?SatStackStatus => {
  const value = useObservable(statusObservable, lastState || undefined);
  lastState = value;
  return value;
};

export default useSatStackStatus;
