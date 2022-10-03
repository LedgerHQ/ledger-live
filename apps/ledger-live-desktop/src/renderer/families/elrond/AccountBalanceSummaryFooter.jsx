// @flow

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { BigNumber } from "bignumber.js";
import { Trans } from "react-i18next";

import Discreet from "~/renderer/components/Discreet";
import InfoCircle from "~/renderer/icons/InfoCircle";
import ToolTip from "~/renderer/components/Tooltip";

import {
  Amount,
  Wrapper,
  Balance,
  Title,
  TitleWrapper,
} from "~/renderer/families/elrond/blocks/Summary";

import { denominate } from "~/renderer/families/elrond/helpers";
import { constants } from "~/renderer/families/elrond/constants";

import type { Account } from "@ledgerhq/live-common/types/index";
import type { UnbondingType, DelegationType } from "./types";

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
  const [delegationsResources, setDelegationResources] = useState(
    account.elrondResources.delegations || [],
  );

  const fetchDelegations = useCallback(() => {
    setDelegationResources(account.elrondResources.delegations || []);

    return () => setDelegationResources(account.elrondResources.delegations || []);
  }, [account.elrondResources.delegations]);

  const available = useMemo((): BigNumber => account.spendableBalance, [account.spendableBalance]);
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
          amount: available,
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
    [available, delegations, unbondings],
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
              {denominate({ input: balance.amount, decimals: 6 })} {constants.egldLabel}
            </Discreet>
          </Amount>
        </Balance>
      ))}
    </Wrapper>
  );
};

export default Summary;
