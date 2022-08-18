const getAccountBannerProps = (state, account, {t}) => {
    const { redelegate } = state

    const description = redelegate ? t("account.banner.redelegation.description") : t("account.banner.delegation.description", { 
        asset: 'ATOM'
    });
    const cta = redelegate ? { 
        text: t("account.banner.redelegation.cta"),
        id: "Relegate"
    } : { 
        text:  t("account.banner.delegation.cta"),
        id: "Stake now"
    };
 
    return { description, cta }
}

export { getAccountBannerProps }
