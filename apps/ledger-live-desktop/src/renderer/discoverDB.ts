import {
  DISCOVER_STORE_KEY,
  INITIAL_PLATFORM_STATE,
} from "@ledgerhq/live-common/wallet-api/constants";
import { DiscoverDB } from "@ledgerhq/live-common/wallet-api/types";
import { useDB } from "./storage";

export function useDiscoverDB<Selected>(selector: (state: DiscoverDB) => Selected) {
  return useDB("app", DISCOVER_STORE_KEY, INITIAL_PLATFORM_STATE, selector);
}
