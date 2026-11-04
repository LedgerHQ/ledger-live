import { createDBRecord, useDBRecord } from "@ledgerhq/live-common/hooks/useDBRaw";
import {
  DISCOVER_STORE_KEY,
  INITIAL_PLATFORM_STATE,
} from "@ledgerhq/live-common/wallet-api/constants";
import { DiscoverDB } from "@ledgerhq/live-common/wallet-api/types";
import { getKey, setKey } from "./storage";

const discoverRecord = createDBRecord<DiscoverDB>({
  initialState: INITIAL_PLATFORM_STATE,
  getter: () => getKey("app", DISCOVER_STORE_KEY, INITIAL_PLATFORM_STATE),
  setter: state => setKey("app", DISCOVER_STORE_KEY, state),
});

export function useDiscoverDB<Selected>(selector: (state: DiscoverDB) => Selected) {
  return useDBRecord(discoverRecord, selector);
}
