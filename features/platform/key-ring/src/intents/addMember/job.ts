import type { Job } from "@features/platform-device-intent";
import type { KeyRingActivation } from "../../types";
import { createLedgerSyncJob } from "../../internals/createLedgerSyncJob";
import type { AddMemberIntentInput, AddMemberJobState } from "./types";

/**
 * Activates the key ring on the DIE session: creates the key tree of the device seed, joins it,
 * or restores this instance in it, with the device signing this instance in.
 *
 * Emits `pending`, then `awaiting-device-confirmation` and `processing` for each confirmation,
 * then `completed` after `onResult`. A refusal emits `device-rejected`, any other error
 * `failed`. A device disconnection errors the observable so DIE shows its Disconnected screen.
 */
export const addMemberIntentJob: Job<AddMemberJobState, AddMemberIntentInput, KeyRingActivation> =
  createLedgerSyncJob<AddMemberIntentInput, KeyRingActivation>(({ client, input, callbacks }) =>
    client.activate(input.session, {
      callbacks,
      allowTreeCreation: input.allowTreeCreation,
    }),
  );
