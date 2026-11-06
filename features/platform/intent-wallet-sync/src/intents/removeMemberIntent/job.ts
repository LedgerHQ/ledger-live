import type { Job } from "@features/platform-device-intent";
import type { Trustchain } from "@ledgerhq/ledger-key-ring-protocol/types";
import { createLedgerSyncJob } from "../internals/createLedgerSyncJob";
import type { RemoveMemberIntentInput, RemoveMemberJobState } from "./types";

/** Removes a member from the trustchain, which rotates its key with the device of the DIE session. */
export const removeMemberIntentJob: Job<RemoveMemberJobState, RemoveMemberIntentInput, Trustchain> =
  createLedgerSyncJob<RemoveMemberIntentInput, Trustchain>(({ sdk, deviceId, input, callbacks }) =>
    sdk.removeMember(deviceId, input.trustchain, input.memberCredentials, input.member, callbacks),
  );
