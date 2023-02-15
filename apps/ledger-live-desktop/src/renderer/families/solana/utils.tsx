import { openModal } from "~/renderer/actions/modals";

const getAccountBannerProps = (
  state,
  account,
  { t, dispatch, stakeAccountBannerParams, stakesWithMeta },
) => {
  const { redelegate, display, ledgerValidator, stakeAccAddr } = state;

  if (!display) return { display: false };
  if (redelegate && !stakeAccountBannerParams?.solana.redelegate) return { display: false };
  if (!redelegate && !stakeAccountBannerParams?.solana.delegegate) return { display: false };

  const commission = ledgerValidator?.commission ? ledgerValidator?.commission : 1;
  const stakeWithMeta = stakesWithMeta?.find(s => s.stake.stakeAccAddr === stakeAccAddr);
  const title = redelegate
    ? t("account.banner.redelegation.solana.title")
    : t("account.banner.delegation.title");
  const description = redelegate
    ? t("account.banner.redelegation.solana.description")
    : t("account.banner.delegation.description", {
        asset: account.currency.ticker,
        commission,
      });
  const cta = redelegate
    ? t("account.banner.redelegation.cta")
    : t("account.banner.delegation.cta");
  const linkText = redelegate
    ? t("account.banner.redelegation.solana.linkText")
    : t("account.banner.delegation.linkText");
  const linkUrl = redelegate
    ? "https://support.ledger.com/hc/en-us/articles/4731749170461-Staking-Solana-SOL-in-Ledger-Live?support=true"
    : "https://www.ledger.com/staking/ledger-node/solana";
  const onClick = () => {
    if (redelegate) {
      dispatch(
        openModal("MODAL_SOLANA_DELEGATION_DEACTIVATE", {
          account,
          stakeWithMeta,
        }),
      );
    } else {
      dispatch(
        openModal("MODAL_SOLANA_DELEGATE", {
          account,
        }),
      );
    }
  };

  return {
    title,
    description,
    cta,
    onClick,
    display,
    linkText,
    linkUrl,
  };
};

export { getAccountBannerProps };
