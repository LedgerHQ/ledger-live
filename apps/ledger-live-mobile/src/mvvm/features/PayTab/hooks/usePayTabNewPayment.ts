import { useCallback } from "react";
import { AssetCategory } from "@domain/api-aggregated-assets";
import { useOpenSendFlow } from "LLM/features/Send/hooks/useOpenSendFlow";

const PAY_PAGE = "Pay";
const PAY_CATEGORIES: AssetCategory[] = [AssetCategory.Stablecoins];

export type UsePayTabNewPayment = Readonly<{
  open: () => void;
}>;

export function usePayTabNewPayment(): UsePayTabNewPayment {
  const { handleOpenSendFlow } = useOpenSendFlow({
    sourceScreenName: PAY_PAGE,
    categories: PAY_CATEGORIES,
  });

  const open = useCallback(() => handleOpenSendFlow(), [handleOpenSendFlow]);

  return { open };
}
