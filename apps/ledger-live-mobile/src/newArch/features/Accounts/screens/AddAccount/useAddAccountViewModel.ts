import { useCallback } from "react";
import { track } from "~/analytics";

type AddAccountDrawerProps = {
  isOpened: boolean;
  onClose: () => void;
};

const useAddAccountViewModel = ({ isOpened, onClose }: AddAccountDrawerProps) => {
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

  return {
    isAddAccountDrawerVisible: isOpened,
    onCloseAddAccountDrawer,
  };
};

export default useAddAccountViewModel;
