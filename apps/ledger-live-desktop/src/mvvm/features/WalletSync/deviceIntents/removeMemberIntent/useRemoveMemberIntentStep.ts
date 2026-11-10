import { useCallback, useEffect, useState } from "react";
import { createIntent } from "@features/platform-device-intent";
import type {
  RemoveMemberIntent,
  RemoveMemberJobState,
} from "@features/platform-intent-wallet-sync";
import {
  memberCredentialsSelector,
  setTrustchain,
  trustchainSelector,
} from "@ledgerhq/ledger-key-ring-protocol/store";
import type { Trustchain, TrustchainMember } from "@ledgerhq/ledger-key-ring-protocol/types";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { setFlow } from "~/renderer/actions/walletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { useCreateSessionSdk } from "../useCreateSessionSdk";
import { removeMemberIntentLWDDefinition } from "./intentLWDDefinition";

/**
 * Removes another instance from the trustchain on DIE, then leaves the device step the way the
 * legacy `DeleteInstanceWithTrustChain` step does.
 */
export function useRemoveMemberIntentStep(member: TrustchainMember | null) {
  const dispatch = useDispatch();
  const createSessionSdk = useCreateSessionSdk();
  const memberCredentials = useSelector(memberCredentialsSelector);
  const trustchain = useSelector(trustchainSelector);
  const [run, setRun] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const onUserCancel = useCallback(
    () => dispatch(setFlow({ flow: Flow.ManageInstances, step: Step.SynchronizedInstances })),
    [dispatch],
  );

  useEffect(() => {
    if (!member) onUserCancel();
  }, [member, onUserCancel]);

  const onResult = useCallback(
    (newTrustchain: Trustchain) => dispatch(setTrustchain(newTrustchain)),
    [dispatch],
  );

  const onJobStateChanged = useCallback(
    (jobState: RemoveMemberJobState) => {
      if (jobState.type === "completed") {
        dispatch(setFlow({ flow: Flow.ManageInstances, step: Step.InstanceSuccesfullyDeleted }));
      } else if (jobState.type === "failed" && jobState.reason === "not-allowed") {
        dispatch(setFlow({ flow: Flow.ManageInstances, step: Step.UnsecuredLedger }));
      } else if (jobState.type === "failed") {
        setError(jobState.error);
      }
    },
    [dispatch],
  );

  const createRunIntent =
    member && trustchain && memberCredentials
      ? (): RemoveMemberIntent =>
          createIntent(
            removeMemberIntentLWDDefinition,
            { trustchain, memberCredentials, member, createSessionSdk },
            { onResult, onJobStateChanged },
          )
      : null;

  const onRetry = useCallback(() => {
    setError(null);
    setRun(previousRun => previousRun + 1);
  }, []);

  return { run, error, createRunIntent, onUserCancel, onRetry };
}
