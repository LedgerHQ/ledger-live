import { openModal } from "~/renderer/actions/modals";
import { LEDGER_VALIDATOR_ADDRESS } from "@ledgerhq/live-common/families/cosmos/utils";

const getAccountBannerProps = (state, account, { t, dispatch }) => {
  const { display, redelegate, ledgerValidator, validatorSrcAddress } = state;

  const title = redelegate
    ? t("account.banner.redelegation.title")
    : t("account.banner.delegation.title");
  const description = redelegate
    ? t("account.banner.redelegation.description")
    : t("account.banner.delegation.description", {
        asset: "ATOM",
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
