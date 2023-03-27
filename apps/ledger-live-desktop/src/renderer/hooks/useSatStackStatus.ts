import { useObservable } from "@ledgerhq/live-common/observable";

// FIXME this needs to move to coin specifics
// eslint-disable-next-line no-restricted-imports
import { statusObservable } from "@ledgerhq/live-common/families/bitcoin/satstack";
// eslint-disable-next-line no-restricted-imports
import { SatStackStatus } from "@ledgerhq/live-common/families/bitcoin/satstack";

let lastState;
const useSatStackStatus = (): SatStackStatus | undefined | null => {
  const value = useObservable(statusObservable, lastState || undefined);
  lastState = value;
  return value;
};
export default useSatStackStatus;
