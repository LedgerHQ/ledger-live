import { useMemo } from "react";
import { useSendFlowBusinessLogic as useCommonBusinessLogic } from "@ledgerhq/live-common/flows/send/hooks/useSendFlowBusinessLogic";
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
 * Desktop-specific wrapper for Send flow business logic
 * Injects desktop-specific operation handling into common logic
 */
export function useSendFlowBusinessLogic({
  initParams,
  onClose,
}: UseSendFlowBusinessLogicParams): SendFlowBusinessContext {
  const businessLogic = useCommonBusinessLogic({
    initParams,
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
