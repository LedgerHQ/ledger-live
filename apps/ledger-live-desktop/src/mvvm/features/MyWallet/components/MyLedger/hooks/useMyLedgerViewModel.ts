import { useTranslation } from "react-i18next";
import { useMyLedger } from "LLD/components/TopBar/hooks/useMyLedger";
import type { DeviceIconComponent } from "LLD/utils/getDeviceIcon";

export type MyLedgerViewModel = {
  title: string;
  description: string;
  icon: DeviceIconComponent;
  handleClick: () => void;
};

export function useMyLedgerViewModel(): MyLedgerViewModel {
  const { t } = useTranslation();
  const { handleMyLedger, icon } = useMyLedger();

  return {
    title: t("myWallet.myLedger.title"),
    description: t("myWallet.myLedger.description"),
    icon,
    handleClick: handleMyLedger,
  };
}
