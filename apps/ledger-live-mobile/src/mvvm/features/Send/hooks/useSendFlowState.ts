import { useMemo } from "react";
import { useSendFlowBusinessLogic as useCommonBusinessLogic } from "@ledgerhq/live-common/flows/send/hooks/useSendFlowBusinessLogic";
import { useSelector } from "~/context/hooks";
import { accountsSelector } from "~/reducers/accounts";
import { useSendFlowTransaction } from "./useSendFlowTransaction";
import { useSendFlowOperation } from "./useSendFlowOperation";
import type {
  SendFlowBusinessContext,
  SendFlowInitParams,
} from "@ledgerhq/live-common/flows/send/types";

type UseSendFlowBusinessLogicParams = Readonly<{
  initParams?: SendFlowInitParams;
  onClose: () => void;
}>;

/**
 * Mobile-specific wrapper for Send flow business logic
 * Injects mobile-specific operation handling into common logic
 */
export function useSendFlowBusinessLogic({
  initParams,
  onClose,
}: UseSendFlowBusinessLogicParams): SendFlowBusinessContext {
  const accounts = useSelector(accountsSelector);
  const businessLogic = useCommonBusinessLogic({
    initParams,
    accounts,
    useOperationHook: useSendFlowOperation,
    useTransactionHook: useSendFlowTransaction,
  });

  return useMemo(
    () => ({
      ...businessLogic,
      close: onClose,
    }),
    [businessLogic, onClose],
  );
}
