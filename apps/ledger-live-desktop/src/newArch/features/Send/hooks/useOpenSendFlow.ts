import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { openModal } from "~/renderer/actions/modals";
import BigNumber from "bignumber.js";
import { openSendFlowDialog, type SendFlowParams } from "~/renderer/reducers/sendFlow";
import { useNewSendFlowFeature } from "./useNewSendFlowFeature";

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
      const family = getFamilyFromAccount(params?.account, params?.parentAccount ?? null);
      const shouldUseNewFlow = isEnabledForFamily(family);

      if (shouldUseNewFlow) {
        let normalizedAmount: string | undefined;
        if (typeof params?.amount === "string") {
          normalizedAmount = params.amount;
        } else if (params?.amount) {
          normalizedAmount = params.amount.toString();
        } else {
          normalizedAmount = undefined;
        }

        const normalizedParams: SendFlowParams = {
          ...params,
          amount: normalizedAmount,
          fromMAD: params?.fromMAD ?? false,
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
          ...params,
          amount:
            typeof params?.amount === "string" ? new BigNumber(params.amount) : params?.amount,
        }),
      );
    },
    [dispatch, isEnabledForFamily, getFamilyFromAccount],
  );

  return openSendFlow;
}
