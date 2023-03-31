import React, { useState, useEffect, useMemo, useCallback } from "react";
import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { BigNumber } from "bignumber.js";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import { localeSelector } from "~/renderer/reducers/settings";
import Discreet, { useDiscreetMode } from "~/renderer/components/Discreet";
import InfoCircle from "~/renderer/icons/InfoCircle";
import ToolTip from "~/renderer/components/Tooltip";
import {
  Amount,
  Wrapper,
  Balance,
  Title,
  TitleWrapper,
} from "~/renderer/families/elrond/blocks/Summary";
import { Account } from "@ledgerhq/live-common/types/index";
import { UnbondingType, DelegationType } from "./types";
interface Props {
  account: Account;
}
interface BalanceType {
  tooltip: string;
  title: string;
  show: boolean;
  amount: BigNumber;
}
const Summary = (props: Props) => {
  const { account } = props;
  const [balance, setBalance] = useState<BigNumber>(account.spendableBalance);
  const [delegationsResources, setDelegationResources] = useState(
    account.elrondResources ? account.elrondResources.delegations : [],
  );
  const discreet = useDiscreetMode();
  const locale = useSelector(localeSelector);
  const unit = getAccountUnit(account);
  const fetchDelegations = useCallback(() => {
    setBalance(account.spendableBalance);
    setDelegationResources(account.elrondResources ? account.elrondResources.delegations : []);
    return () => {
      setBalance(account.spendableBalance);
      setDelegationResources(account.elrondResources ? account.elrondResources.delegations : []);
    };
  }, [account.elrondResources, account.spendableBalance]);
  const delegations = useMemo(
    (): BigNumber =>
      delegationsResources.reduce(
        (total: BigNumber, delegation: DelegationType) => total.plus(delegation.userActiveStake),
        BigNumber(0),
      ),
    [delegationsResources],
  );
  const unbondings = useMemo(
    (): BigNumber =>
      delegationsResources.reduce(
        (total: BigNumber, item: UnbondingType) => total.plus(item.userUnBondable),
        BigNumber(0),
      ),
    [delegationsResources],
  );
  const balances = useMemo(
    (): Array<BalanceType> =>
      [
        {
          tooltip: "elrond.summary.availableBalanceTooltip",
          title: "elrond.summary.availableBalance",
          amount: balance,
          show: true,
        },
        {
          tooltip: "elrond.summary.delegatedAssetsTooltip",
          title: "elrond.summary.delegatedAssets",
          amount: delegations,
          show: delegations.gt(0),
        },
        {
          tooltip: "elrond.summary.undelegatingTooltip",
          title: "elrond.summary.undelegating",
          amount: unbondings,
          show: unbondings.gt(0),
        },
      ].filter(balance => balance.show),
    [balance, delegations, unbondings],
  );
  useEffect(fetchDelegations, [fetchDelegations]);
  return (
    <Wrapper>
      {balances.map(balance => (
        <Balance key={balance.title}>
          <ToolTip content={<Trans i18nKey={balance.tooltip} />}>
            <TitleWrapper>
              <Title>
                <Trans i18nKey={balance.title} />
              </Title>
              <InfoCircle size={13} />
            </TitleWrapper>
          </ToolTip>

          <Amount>
            <Discreet>
              {formatCurrencyUnit(unit, balance.amount, {
                alwaysShowSign: false,
                showCode: true,
                discreet,
                locale,
              })}
            </Discreet>
          </Amount>
        </Balance>
      ))}
    </Wrapper>
  );
};
export default Summary;
