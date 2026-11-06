import type { Job } from "@features/platform-device-intent";
import type { Trustchain } from "@ledgerhq/ledger-key-ring-protocol/types";
import { createLedgerSyncJob } from "../../internals/createLedgerSyncJob";
import type { RemoveMemberIntentInput, RemoveMemberJobState } from "./types";

/**
 * Runs `removeMember` on the DIE session: removes the member and rotates the trustchain key,
 * with the device signing the change.
 *
 * Emits `pending`, then `awaiting-device-confirmation` and `processing` for each confirmation,
 * then `completed` after `onResult`. A refusal emits `device-rejected`, any other SDK error
 * `failed`. A device disconnection errors the observable so DIE shows its Disconnected screen.
 */
export const removeMemberIntentJob: Job<RemoveMemberJobState, RemoveMemberIntentInput, Trustchain> =
  createLedgerSyncJob<RemoveMemberIntentInput, Trustchain>(({ sdk, deviceId, input, callbacks }) =>
    sdk.removeMember(deviceId, input.trustchain, input.memberCredentials, input.member, callbacks),
  );
