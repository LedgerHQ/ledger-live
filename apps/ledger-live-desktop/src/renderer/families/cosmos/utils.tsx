import { openModal } from "~/renderer/actions/modals";
import { BannerProps } from "~/renderer/screens/account/AccountBanner";
import { AccountBannerState } from "@ledgerhq/live-common/lib/families/cosmos/banner";
import { CosmosAccount } from "@ledgerhq/live-common/lib/families/cosmos/types";
import { Hooks } from "~/renderer/screens/account/useGetBannerProps";

const getAccountBannerProps = (
  state: AccountBannerState,
  account: CosmosAccount,
  { t, dispatch, stakeAccountBannerParams }: Hooks,
): BannerProps => {
  const { display, redelegate, ledgerValidator, validatorSrcAddress } = state;

  if (!display) return { display: false };
  if (redelegate && !stakeAccountBannerParams?.cosmos?.redelegate) return { display: false };
  if (!redelegate && !stakeAccountBannerParams?.cosmos?.delegate) return { display: false };

  const commission = ledgerValidator?.commission ? ledgerValidator?.commission * 100 : 1;
  const title = redelegate
    ? t("account.banner.redelegation.title")
    : t("account.banner.delegation.title");
  const description = redelegate
    ? t("account.banner.redelegation.description")
    : t("account.banner.delegation.description", {
        asset: account.currency.ticker,
        commission,
      });
  const cta = redelegate
    ? t("account.banner.redelegation.cta")
    : t("account.banner.delegation.cta");

  const onClick = () => {
    if (redelegate) {
      dispatch(
        openModal("MODAL_COSMOS_REDELEGATE", {
          account,
          validatorAddress: validatorSrcAddress,
          validatorDstAddress: ledgerValidator?.validatorAddress || "",
        }),
      );
    } else {
      dispatch(
        openModal("MODAL_COSMOS_DELEGATE", {
          account,
        }),
      );
    }
  };

  return { title, description, cta, onClick, display };
};

export { getAccountBannerProps };
