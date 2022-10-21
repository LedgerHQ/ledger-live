// @flow
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import IconCoins from "~/renderer/icons/ClaimReward";
import { useHistory } from "react-router-dom";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { BigNumber } from "bignumber.js";
import { getAccountUnit } from "@ledgerhq/live-common/account/index";
type Props = {
  account: AccountLike,
  parentAccount: ?Account,
};

const AccountHeaderActions = ({ account, parentAccount }: Props) => {
  const { t } = useTranslation();
  const history = useHistory();
  const ethStakingProviders = useFeature("ethStakingProviders");
  const [provider, setProvider] = useState({ liveAppId: "lido", name: "Lido" });
  const unit = getAccountUnit(account);

  useEffect(() => {
    const providers = ethStakingProviders?.params?.listProvider;
    if (providers && providers.length > 0) {
      const newProvider = providers.find(
        provider =>
          !provider.minAccountBalance ||
          account.balance.gte(
            new BigNumber(provider.minAccountBalance).times(new BigNumber(10).pow(unit.magnitude)),
          ),
      );
      if (newProvider) {
        setProvider(newProvider);
      }
    }
  }, [account.balance, ethStakingProviders?.params?.listProvider, setProvider, unit]);

  const onPlatformStake = useCallback(() => {
    history.push({ pathname: `/platform/${provider.liveAppId}`, state: { accountId: account.id } });
  }, [history, provider.liveAppId, account.id]);

  if (account.type === "Account") {
    return [
      {
        key: "Stake",
        onClick: onPlatformStake,
        event: "Eth Stake Account Button",
        icon: IconCoins,
        label: t("account.stake", { currency: account?.currency?.name }),
        provider,
      },
    ];
  } else {
    return [];
  }
};

export default AccountHeaderActions;
