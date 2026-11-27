import { handlers as operationDetailsHandlers } from "@features/platform-wallet-api-operation-details";
import type { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import type { AccountLike } from "@ledgerhq/types-live";
import { useContext, useMemo } from "react";
import { OperationDetails } from "~/renderer/drawers/OperationDetails";
import { context } from "~/renderer/drawers/Provider";
import { findOperationDetailsTarget } from "../utils/findOperationDetailsTarget";

export function useOperationDetailsHandlers(accounts: AccountLike[]) {
  const { setDrawer } = useContext(context);

  return useMemo<WalletAPICustomHandlers>(
    () =>
      operationDetailsHandlers({
        uiHooks: {
          "operationDetails.open": request => {
            const { accountId, parentId, operation } = findOperationDetailsTarget(
              accounts,
              request,
            );
            setDrawer(OperationDetails, { operationId: operation.id, accountId, parentId });
          },
        },
      }),
    [accounts, setDrawer],
  );
}
