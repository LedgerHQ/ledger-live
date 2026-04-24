import { useTranslation } from "react-i18next";
import { useMyLedger } from "LLD/components/TopBar/hooks/useMyLedger";
import type { DeviceIconComponent } from "LLD/utils/getDeviceIcon";
import { useContextMenuClose } from "../../ContextMenuContext";

export type MyLedgerViewModel = {
  title: string;
  description: string;
  icon: DeviceIconComponent;
  handleClick: () => void;
};

export function useMyLedgerViewModel(): MyLedgerViewModel {
  const close = useContextMenuClose();
  const { t } = useTranslation();
  const { handleMyLedger, icon } = useMyLedger();

  const handleClick = () => {
    handleMyLedger();
    close();
  };

  return {
    title: t("myWallet.myLedger.title"),
    description: t("myWallet.myLedger.description"),
    icon,
    handleClick,
  };
}
