import { useCallback } from "react";
import { AssetCategory } from "@domain/api-aggregated-assets";
import { useOpenSendFlow } from "LLD/features/Send/hooks/useOpenSendFlow";

const PAY_PAGE = "Pay";

// Card payments only spend stablecoins; filter the account picker by category so the
// user still picks any supported network without listing every currency id.
const PAY_CATEGORIES = [AssetCategory.Stablecoins] as const;

export type UsePayTabNewPayment = Readonly<{
  open: () => void;
}>;

export function usePayTabNewPayment(): UsePayTabNewPayment {
  const openSendFlow = useOpenSendFlow();

  const open = useCallback(() => {
    openSendFlow({ source: PAY_PAGE, categories: PAY_CATEGORIES });
  }, [openSendFlow]);

  return { open };
}
