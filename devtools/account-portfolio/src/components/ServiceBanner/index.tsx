import { Banner } from "@ledgerhq/lumen-ui-react";
import type { AccountPortfolioViewModel } from "../../AccountPortfolio/types";

/**
 * Only for a disabled service, which needs a way out. A working one is shown by the navigation
 * bar, so there is nothing more to say.
 */
export function ServiceBanner({
  serviceUrl,
}: Readonly<Pick<AccountPortfolioViewModel, "serviceUrl">>) {
  if (serviceUrl) return null;
  return (
    <Banner
      appearance="error"
      title="Service disabled"
      description="PORTFOLIO_SERVICE_URL is empty. Set it in apps/ledger-live-desktop/.env, then restart the dev server."
    />
  );
}
