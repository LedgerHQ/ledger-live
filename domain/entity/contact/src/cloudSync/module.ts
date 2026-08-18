import type { CloudSyncDataManager } from "@shared/cloud-sync-module";
import { ContactsDistantSchema, parseContactsWire } from "./distantSchema";
import { mergeContactsDistantExtensions } from "./extensions";
import {
  emptyDistantContactsState,
  hasSameContactsWire,
  isUntouchedContactsWire,
  toContactsWire,
  toLocalContacts,
} from "./state";
import type { Contact } from "../types";

export { ContactsDistantSchema } from "./distantSchema";

export const contactsSyncModule: CloudSyncDataManager<
  Contact[],
  Contact[],
  typeof ContactsDistantSchema,
  unknown
> = {
  schema: ContactsDistantSchema,

  diffLocalToDistant(localData, latestState) {
    const localWire = toContactsWire(localData);
    if (localWire === null) {
      return { hasChanges: false as const, nextState: latestState ?? emptyDistantContactsState };
    }

    if (latestState === null) {
      return {
        hasChanges: !isUntouchedContactsWire(localWire),
        nextState: localWire,
      };
    }

    const latestWire = parseContactsWire(latestState);
    if (latestWire === null || hasSameContactsWire(localWire, latestWire)) {
      return { hasChanges: false as const, nextState: latestState };
    }

    return {
      hasChanges: true as const,
      nextState: mergeContactsDistantExtensions(latestState, localWire),
    };
  },

  async resolveIncrementalUpdate(localData, latestState, incomingState) {
    if (incomingState === null || incomingState === latestState) {
      return { hasChanges: false as const };
    }

    const incomingWire = parseContactsWire(incomingState);
    const incomingContacts = incomingWire === null ? null : toLocalContacts(incomingWire);
    if (incomingWire === null || incomingContacts === null) {
      return { hasChanges: false as const };
    }

    const localWire = toContactsWire(localData);
    if (localWire !== null && hasSameContactsWire(localWire, incomingWire)) {
      return { hasChanges: false as const };
    }

    return { hasChanges: true as const, update: incomingContacts };
  },

  applyUpdate(_localData, update) {
    return update;
  },
};
