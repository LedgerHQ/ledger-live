import { useCallback } from "react";
import { useNavigate } from "react-router";
import { urls } from "~/config/urls";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { openURL } from "~/renderer/linking";

const MANAGER_ROUTE = "/manager";
const ONBOARDING_ROUTE = "/onboarding/select-device";

export function useInitializerActions() {
  const navigate = useNavigate();
  const contactSupportUrl = useLocalizedUrl(urls.contactSupport);

  const openMyLedger = useCallback(
    (searchQuery?: string) => {
      if (!searchQuery) {
        navigate(MANAGER_ROUTE);
        return;
      }

      navigate(`${MANAGER_ROUTE}?q=${encodeURIComponent(searchQuery)}`);
    },
    [navigate],
  );

  const openMyLedgerFirmwareUpdate = useCallback(() => {
    navigate(`${MANAGER_ROUTE}?firmwareUpdate=true`);
  }, [navigate]);

  const openOnboarding = useCallback(() => {
    navigate(ONBOARDING_ROUTE);
  }, [navigate]);

  const openSupport = useCallback(() => {
    openURL(contactSupportUrl);
  }, [contactSupportUrl]);

  return {
    openMyLedger,
    openMyLedgerFirmwareUpdate,
    openOnboarding,
    openSupport,
  };
}
