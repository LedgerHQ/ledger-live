import { useCallback, useState } from "react";
import { track } from "~/analytics";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

type AddAccountDrawerProps = {
  isOpened: boolean;
  currency?: CryptoCurrency | TokenCurrency | null;
  onClose: () => void;
  reopenDrawer: () => void;
};

const useAddAccountViewModel = ({ isOpened, onClose, reopenDrawer }: AddAccountDrawerProps) => {
  const [isWalletSyncDrawerVisible, setWalletSyncDrawerVisible] = useState(false);

  const trackButtonClick = useCallback((button: string) => {
    track("button_clicked", {
      button,
      drawer: "AddAccountsModal",
    });
  }, []);

  const onCloseAddAccountDrawer = useCallback(() => {
    trackButtonClick("Close 'x'");
    onClose();
  }, [trackButtonClick, onClose]);

  const onCloseWalletSyncDrawer = () => {
    setWalletSyncDrawerVisible(false);
    reopenDrawer();
  };

  const onRequestToOpenWalletSyncDrawer = () => {
    onCloseAddAccountDrawer();
    setWalletSyncDrawerVisible(true);
  };

  return {
    isAddAccountDrawerVisible: isOpened,
    isWalletSyncDrawerVisible,
    onCloseAddAccountDrawer,
    onCloseWalletSyncDrawer,
    onRequestToOpenWalletSyncDrawer,
  };
};

export default useAddAccountViewModel;
