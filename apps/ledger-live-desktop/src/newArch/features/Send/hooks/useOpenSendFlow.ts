import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { openModal } from "~/renderer/actions/modals";
import BigNumber from "bignumber.js";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { openSendFlowDialog, type SendFlowParams } from "~/renderer/reducers/sendFlow";

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
  const newSendFlow = useFeature("newSendFlow");

  const openSendFlow = useCallback(
    (params?: WorkflowParams) => {
      if (newSendFlow?.enabled) {
        const normalizedParams: SendFlowParams = {
          ...params,
          amount:
            typeof params?.amount === "string"
              ? params.amount
              : params?.amount
                ? params.amount.toString()
                : undefined,
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
    [dispatch, newSendFlow?.enabled],
  );

  return openSendFlow;
}
