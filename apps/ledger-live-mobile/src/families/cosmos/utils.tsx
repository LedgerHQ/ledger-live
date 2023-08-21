import type { AccountBannerState } from "@ledgerhq/live-common/families/cosmos/banner";
import { Account } from "@ledgerhq/types-live";
import { TFunction } from "react-i18next";

const getAccountBannerProps = (
  state: AccountBannerState,
  { t }: { t: TFunction },
  account: Account,
) => {
  const { redelegate } = state;

  const description = redelegate
    ? t("account.banner.redelegation.description")
    : t("account.banner.delegation.description", {
        asset: account.currency.ticker,
      });
  const cta = redelegate
    ? t("account.banner.redelegation.cta")
    : t("account.banner.delegation.cta");

  return { description, cta };
};

export { getAccountBannerProps };
