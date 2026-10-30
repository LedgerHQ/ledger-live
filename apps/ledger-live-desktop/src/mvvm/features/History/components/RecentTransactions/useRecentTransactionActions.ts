import { useCallback } from "react";
import { useNavigate } from "react-router";
import { track } from "@shared/analytics";
import { buildNavigationBackState } from "LLD/utils/navigationBackPath";
import { setDrawer } from "~/renderer/drawers/Provider";
import { OperationDetails } from "~/renderer/drawers/OperationDetails";
import type { OperationRow } from "../../types";

type RecentTransactionActionsParams = Readonly<{
  accountIdsKey: string;
  trackingPage: string;
  trackingCurrencyId?: string;
  backPath: string;
}>;

export function useRecentTransactionActions({
  accountIdsKey,
  trackingPage,
  trackingCurrencyId,
  backPath,
}: RecentTransactionActionsParams) {
  const navigate = useNavigate();

  const onRowClick = useCallback(
    (row: OperationRow) => {
      const { operation, account, parentAccount } = row.original;
      track("transaction_clicked", {
        transaction: operation.type,
        page: trackingPage,
        currency: trackingCurrencyId,
      });
      setDrawer(OperationDetails, {
        operationId: operation.id,
        accountId: account.id,
        parentId: parentAccount?.id,
      });
    },
    [trackingPage, trackingCurrencyId],
  );

  const onSeeAll = useCallback(() => {
    track("button_clicked", {
      button: "Transactions",
      currency: trackingCurrencyId,
      page: trackingPage,
    });
    navigate(
      `/history?accountIds=${encodeURIComponent(accountIdsKey)}`,
      buildNavigationBackState("historyBackPath", backPath),
    );
  }, [accountIdsKey, backPath, navigate, trackingCurrencyId, trackingPage]);

  return { onRowClick, onSeeAll };
}
