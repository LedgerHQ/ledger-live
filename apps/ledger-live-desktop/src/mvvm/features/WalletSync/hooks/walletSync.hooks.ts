import {
  ledgerSyncErrorForDisplay,
  useLedgerSyncErrorRecovery,
  type LedgerSyncErrorRecovery,
} from "@features/platform-ledger-sync";
import { useDispatch } from "LLD/hooks/redux";
import { setFlow } from "~/renderer/actions/walletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { useKeyRingClient } from "./useKeyRingClient";

export function useLifeCycle(): LedgerSyncErrorRecovery {
  const dispatch = useDispatch();
  const client = useKeyRingClient();

  return useLedgerSyncErrorRecovery({
    client,
    onReset: () => dispatch(setFlow({ flow: Flow.Activation, step: Step.CreateOrSynchronize })),
    logError: error => console.error("GetMember :" + ledgerSyncErrorForDisplay(error)),
  });
}
