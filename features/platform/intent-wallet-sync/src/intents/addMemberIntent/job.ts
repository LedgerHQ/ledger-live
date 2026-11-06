import type { Job } from "@features/platform-device-intent";
import type { TrustchainResult } from "@ledgerhq/ledger-key-ring-protocol/types";
import { createLedgerSyncJob } from "../internals/createLedgerSyncJob";
import type { AddMemberIntentInput, AddMemberJobState } from "./types";

/**
 * Creates the trustchain, joins an existing one, or restores it, with the
 * device of the DIE session signing the member in.
 */
export const addMemberIntentJob: Job<AddMemberJobState, AddMemberIntentInput, TrustchainResult> =
  createLedgerSyncJob<AddMemberIntentInput, TrustchainResult>(
    ({ sdk, deviceId, input, callbacks }) =>
      sdk.getOrCreateTrustchain(
        deviceId,
        input.memberCredentials,
        callbacks,
        undefined,
        input.currentTrustchain,
      ),
  );
