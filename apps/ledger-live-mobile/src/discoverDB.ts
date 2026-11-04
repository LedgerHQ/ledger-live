import { createDBRecord, useDBRecord } from "@ledgerhq/live-common/hooks/useDBRaw";
import {
  DISCOVER_STORE_KEY,
  INITIAL_PLATFORM_STATE,
} from "@ledgerhq/live-common/wallet-api/constants";
import { DiscoverDB } from "@ledgerhq/live-common/wallet-api/types";
import storage from "LLM/storage";

const discoverRecord = createDBRecord<DiscoverDB>({
  initialState: INITIAL_PLATFORM_STATE,
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  getter: () => storage.get(DISCOVER_STORE_KEY) as Promise<DiscoverDB | undefined>,
  setter: state => storage.save(DISCOVER_STORE_KEY, state),
});

export function useDiscoverDB<Selected>(selector: (state: DiscoverDB) => Selected) {
  return useDBRecord(discoverRecord, selector);
}
