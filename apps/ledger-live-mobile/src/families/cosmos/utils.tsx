const getAccountBannerProps = (state, account, { t }) => {
  const { redelegate } = state;

  const description = redelegate
    ? t("account.banner.redelegation.description")
    : t("account.banner.delegation.description", {
        asset: "ATOM",
      });
  const cta = redelegate
    ? t("account.banner.redelegation.cta")
    : t("account.banner.delegation.cta");

  return { description, cta };
};

export { getAccountBannerProps };
