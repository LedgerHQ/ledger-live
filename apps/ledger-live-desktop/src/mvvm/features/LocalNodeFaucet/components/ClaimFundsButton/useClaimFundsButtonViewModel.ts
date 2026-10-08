import { useCallback, useMemo, useState } from "react";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { useBridgeSync } from "@ledgerhq/live-common/bridge/react/index";
import { claimLocalNodeFunds, getLocalNodeClaim } from "@ledgerhq/live-common/localNode/faucet";
import type { ClaimFundsButtonProps, ClaimFundsButtonViewProps } from "./types";

export function useClaimFundsButtonViewModel({
  account,
  parentAccount,
}: ClaimFundsButtonProps): ClaimFundsButtonViewProps {
  const claim = useMemo(() => getLocalNodeClaim(account, parentAccount), [account, parentAccount]);
  const mainAccountId = getMainAccount(account, parentAccount).id;
  const sync = useBridgeSync();
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<string>();

  const onClaim = useCallback(async () => {
    if (!claim) return;
    setIsClaiming(true);
    setError(undefined);
    try {
      await claimLocalNodeFunds(claim);
      // The airdrop is in a closed ledger by now: show it without waiting for the next sync
      sync({
        type: "SYNC_ONE_ACCOUNT",
        accountId: mainAccountId,
        priority: 10,
        reason: "local-node-claim",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsClaiming(false);
    }
  }, [claim, mainAccountId, sync]);

  return { isVisible: claim !== undefined, isClaiming, error, onClaim };
}
