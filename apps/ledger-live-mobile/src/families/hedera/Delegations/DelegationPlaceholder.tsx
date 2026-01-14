import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import invariant from "invariant";
import { useNavigation } from "@react-navigation/native";
import type { HederaAccount } from "@ledgerhq/live-common/families/hedera/types";
import AccountDelegationInfo from "~/components/AccountDelegationInfo";
import { NavigatorName, ScreenName } from "~/const";
import { urls } from "~/utils/urls";

interface Props {
  account: HederaAccount;
}

export default function DelegationPlaceholder({ account }: Readonly<Props>) {
  invariant(!account.hederaResources?.delegation, "hedera: account shouldn't have delegation");
  const { t } = useTranslation();
  const navigation = useNavigation();

  const onDelegate = useCallback(() => {
    navigation.navigate(NavigatorName.HederaDelegationFlow, {
      screen: ScreenName.HederaDelegationSummary,
      params: {
        accountId: account.id,
      },
    });
  }, [account.id, navigation]);

  return (
    <AccountDelegationInfo
      title={t("account.delegation.info.title")}
      description={t("account.delegation.delegationEarn", { name: account.currency.name })}
      infoTitle={t("account.delegation.howItWorks")}
      ctaTitle={t("account.delegation.info.cta")}
      infoUrl={urls.hedera.staking}
      onPress={onDelegate}
    />
  );
}
