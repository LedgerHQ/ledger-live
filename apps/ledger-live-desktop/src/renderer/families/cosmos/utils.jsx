import { openModal } from "~/renderer/actions/modals";

const getAccountBannerProps = (state, account, { t, dispatch }) => {
  const { display, redelegate, ledgerValidator, validatorSrcAddress } = state;

  const title = redelegate
    ? t("account.banner.redelegation.title")
    : t("account.banner.delegation.title");
  const description = redelegate
    ? t("account.banner.redelegation.description")
    : t("account.banner.delegation.description", {
        asset: account.currency.ticker,
        commission: ledgerValidator?.commission * 100 || 1,
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
