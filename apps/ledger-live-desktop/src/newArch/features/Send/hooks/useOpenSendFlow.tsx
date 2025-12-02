import React, { useCallback } from "react";
import { useDispatch } from "react-redux";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { openModal } from "~/renderer/actions/modals";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { useDialog } from "LLD/components/Dialog";
import SendWorkflow from "LLD/features/Send";
import { DomainServiceProvider } from "@ledgerhq/domain-service/hooks/index";
import BigNumber from "bignumber.js";

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
  const { openDialog, closeDialog } = useDialog();

  const openSendFlow = useCallback(
    (params?: WorkflowParams) => {
      if (!newSendFlow?.enabled) {
        dispatch(
          openModal("MODAL_SEND", {
            ...params,
          }),
        );
        return;
      }

      const normalizedParams: WorkflowParams = {
        ...params,
        amount:
          typeof params?.amount === "string"
            ? params?.amount
            : params?.amount
              ? params.amount.toString()
              : undefined,
        fromMAD: params?.fromMAD ?? false,
      };

      openDialog(
        <DomainServiceProvider>
          <SendWorkflow onClose={closeDialog} params={normalizedParams} />
        </DomainServiceProvider>,
        closeDialog,
      );
    },
    [closeDialog, dispatch, newSendFlow?.enabled, openDialog],
  );

  return openSendFlow;
}
