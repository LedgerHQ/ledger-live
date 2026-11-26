import type { Job } from "@features/platform-device-intent";
import type { KeyRingTreeUpdate } from "../../types";
import { createLedgerSyncJob } from "../../internals/createLedgerSyncJob";
import type { RemoveMemberIntentInput, RemoveMemberJobState } from "./types";

/**
 * Removes the member on the DIE session and rotates the key of the key tree, with the device
 * signing the change.
 *
 * Emits `pending`, then `awaiting-device-confirmation` and `processing` for each confirmation,
 * then `completed` after `onResult`. A refusal emits `device-rejected`, any other error
 * `failed`. A device disconnection errors the observable so DIE shows its Disconnected screen.
 */
export const removeMemberIntentJob: Job<
  RemoveMemberJobState,
  RemoveMemberIntentInput,
  KeyRingTreeUpdate
> = createLedgerSyncJob<RemoveMemberIntentInput, KeyRingTreeUpdate>(
  ({ client, input, callbacks }) =>
    client.removeMember(input.session, { member: input.member, callbacks }),
);
