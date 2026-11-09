import { useMemo } from "react";
import {
  useSendFlowBusinessLogic as useCommonBusinessLogic,
  type SendFlowBusinessContext,
  type SendFlowInitParams,
} from "@features/platform-send-flow";
import { useSelector } from "LLD/hooks/redux";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { useSendFlowTransaction } from "./useSendFlowTransaction";
import { useSendFlowOperation } from "./useSendFlowOperation";
import type { Account, AccountLike } from "@ledgerhq/types-live";

type UseSendFlowBusinessLogicParams = Readonly<{
  initParams?: SendFlowInitParams;
  onClose: () => void;
}>;

/**
 * Desktop-specific wrapper for Send flow business logic
 * Injects desktop-specific operation handling into common logic
 */
export function useSendFlowBusinessLogic({
  initParams,
  onClose,
}: UseSendFlowBusinessLogicParams): SendFlowBusinessContext {
  const initialRecipient =
    initParams?.skipRecipientStep === true ? initParams.recipient?.trim() || undefined : undefined;

  const useTransactionHook = (params: {
    account: AccountLike | null;
    parentAccount: Account | null;
  }) => useSendFlowTransaction({ ...params, initialRecipient });

  const accounts = useSelector(accountsSelector);
  const businessLogic = useCommonBusinessLogic({
    initParams,
    accounts,
    useOperationHook: useSendFlowOperation,
    useTransactionHook,
  });

  return useMemo(
    () => ({
      ...businessLogic,
      close: onClose,
    }),
    [businessLogic, onClose],
  );
}
