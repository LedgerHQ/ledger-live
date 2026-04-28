import { useMemo } from "react";
import { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import { useDeeplinkCustomHandlers } from "~/components/WebPlatformPlayer/CustomHandlers";

type UseBorrowWebViewViewModelProps = {
  customHandlers?: WalletAPICustomHandlers;
};

type UseBorrowWebViewViewModelResult = {
  mergedCustomHandlers: WalletAPICustomHandlers;
};

export const useBorrowWebViewViewModel = ({
  customHandlers,
}: UseBorrowWebViewViewModelProps): UseBorrowWebViewViewModelResult => {
  const customDeeplinkHandlers = useDeeplinkCustomHandlers();

  const mergedCustomHandlers = useMemo<WalletAPICustomHandlers>(
    () => ({ ...customDeeplinkHandlers, ...customHandlers }),
    [customDeeplinkHandlers, customHandlers],
  );

  return { mergedCustomHandlers };
};
