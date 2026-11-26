import type { z } from "zod";
import type {
  KeyRingMemberKeyRecordSchema,
  KeyRingStateSchema,
  KeyRingTreeRecordSchema,
} from "./schema";

/** The key tree this instance belongs to, as stored. Holds the Ledger Sync key: trust package only. */
export type KeyRingTreeRecord = z.infer<typeof KeyRingTreeRecordSchema>;

/** The key pair of this instance, as stored. Holds the private key: trust package only. */
export type KeyRingMemberKeyRecord = z.infer<typeof KeyRingMemberKeyRecordSchema>;

/**
 * The `trustchain` slice: the key tree of this instance and its member key, both nullable. Its
 * shape is the persisted format of both apps; features read it through the semantic selectors.
 */
export type KeyRingState = z.infer<typeof KeyRingStateSchema>;
