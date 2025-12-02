import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { openModal } from "~/renderer/actions/modals";
import BigNumber from "bignumber.js";
import { openSendFlowDialog, type SendFlowParams } from "~/renderer/reducers/sendFlow";
import { useNewSendFlowFeature } from "./useNewSendFlowFeature";
import type { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { closeDialog, openDialog } from "~/renderer/reducers/modularDrawer";

const SEND_ACCOUNT_SELECTION_DRAWER_CONFIGURATION: EnhancedModularDrawerConfiguration = {
  assets: { leftElement: "undefined", rightElement: "balance", filter: "undefined" },
  networks: { leftElement: "undefined", rightElement: "undefined" },
};

type WorkflowParams = {
  account?: AccountLike;
  parentAccount?: Account;
  recipient?: string;
  amount?: string | BigNumber;
  memo?: string;
  fromMAD?: boolean;
  startWithWarning?: boolean;
};

export function useOpenSendFlow() {
  const dispatch = useDispatch();
  const { isEnabledForFamily, getFamilyFromAccount } = useNewSendFlowFeature();

  const openSendFlow = useCallback(
    (params?: WorkflowParams) => {
      const openSendFlowImpl = (nextParams?: WorkflowParams) => {
        if (!nextParams?.account) {
          dispatch(
            openDialog({
              currencies: [],
              drawerConfiguration: SEND_ACCOUNT_SELECTION_DRAWER_CONFIGURATION,
              onAccountSelected: (account: AccountLike, parentAccount?: Account) => {
                dispatch(closeDialog());
                openSendFlowImpl({
                  ...nextParams,
                  account,
                  parentAccount,
                });
              },
            }),
          );
          return;
        }

        const family = getFamilyFromAccount(nextParams.account, nextParams.parentAccount ?? null);
        const shouldUseNewFlow = isEnabledForFamily(family);

        if (shouldUseNewFlow) {
          let normalizedAmount: string | undefined;
          if (typeof nextParams.amount === "string") {
            normalizedAmount = nextParams.amount;
          } else if (nextParams.amount) {
            normalizedAmount = nextParams.amount.toString();
          } else {
            normalizedAmount = undefined;
          }

          const normalizedParams: SendFlowParams = {
            ...nextParams,
            amount: normalizedAmount,
            fromMAD: nextParams.fromMAD ?? false,
          };
          dispatch(
            openSendFlowDialog({
              params: normalizedParams,
            }),
          );
          return;
        }

        dispatch(
          openModal("MODAL_SEND", {
            ...nextParams,
            amount:
              typeof nextParams.amount === "string"
                ? new BigNumber(nextParams.amount)
                : nextParams.amount,
          }),
        );
      };

      openSendFlowImpl(params);
    },
    [dispatch, isEnabledForFamily, getFamilyFromAccount],
  );

  return openSendFlow;
}
