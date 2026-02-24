import { useCallback } from "react";
import { useNavigate } from "react-router";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { openURL } from "~/renderer/linking";
import { urls } from "~/config/urls";

interface LazyOnboardingActions {
  handleConnect: () => void;
  handleBuyDevice: () => void;
}

const useLazyOnboardingActions = (): LazyOnboardingActions => {
  const navigate = useNavigate();
  const urlLedgerShop = useLocalizedUrl(urls.ledgerShop);

  const handleConnect = useCallback(() => {
    navigate("/onboarding/select-device", { state: { fromQuickAction: true } });
  }, []);

  const handleBuyDevice = useCallback(() => openURL(urlLedgerShop), [urlLedgerShop]);

  return {
    handleConnect,
    handleBuyDevice,
  };
};

export default useLazyOnboardingActions;
