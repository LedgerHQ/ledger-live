import type { Job } from "@features/platform-device-intent";
import type { TrustchainResult } from "@ledgerhq/ledger-key-ring-protocol/types";
import { createLedgerSyncJob } from "../../internals/createLedgerSyncJob";
import type { AddMemberIntentInput, AddMemberJobState } from "./types";

/**
 * Runs `getOrCreateTrustchain` on the DIE session: creates the trustchain of the device seed,
 * joins it, or restores it, with the device signing this instance in. `onInitialResponse`, when
 * given, sees the seed's trustchains first and can end the run by throwing.
 *
 * Emits `pending`, then `awaiting-device-confirmation` and `processing` for each confirmation,
 * then `completed` after `onResult`. A refusal emits `device-rejected`, any other SDK error
 * `failed`. A device disconnection errors the observable so DIE shows its Disconnected screen.
 */
export const addMemberIntentJob: Job<AddMemberJobState, AddMemberIntentInput, TrustchainResult> =
  createLedgerSyncJob<AddMemberIntentInput, TrustchainResult>(
    ({ sdk, deviceId, input, callbacks }) =>
      sdk.getOrCreateTrustchain(
        deviceId,
        input.memberCredentials,
        input.onInitialResponse
          ? { ...callbacks, onInitialResponse: input.onInitialResponse }
          : callbacks,
        undefined,
        input.currentTrustchain,
      ),
  );
