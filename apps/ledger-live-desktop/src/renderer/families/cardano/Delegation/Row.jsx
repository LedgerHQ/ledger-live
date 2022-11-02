// @flow

import React, { useCallback, useMemo } from "react";
import styled from "styled-components";
import {
  getMainAccount,
  getAccountUnit,
  getAccountCurrency,
  shortAddressPreview,
} from "@ledgerhq/live-common/account/index";
import { getDefaultExplorerView, getAddressExplorer } from "@ledgerhq/live-common/explorers";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { CardanoDelegation } from "@ledgerhq/live-common/families/cardano/types";
import { openURL } from "~/renderer/linking";
import CounterValue from "~/renderer/components/CounterValue";
import FormattedVal from "~/renderer/components/FormattedVal";
import Text from "~/renderer/components/Text";
import Ellipsis from "~/renderer/components/Ellipsis";
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";
import ContextMenu from "./ContextMenu";

type Props = {
  delegation: CardanoDelegation,
  account: AccountLike,
  parentAccount: ?Account,
};

const Wrapper: ThemedComponent<{ isPending: boolean }> = styled.div`
  display: flex;
  flex-direction: row;
  padding: 16px 20px;
  opacity: ${p => (p.isPending ? 0.5 : 1)};
  > * {
    display: flex;
    align-items: center;
    flex-direction: row;
    box-sizing: border-box;
  }
`;

const Baker = styled.div`
  flex: 1.5;
  color: ${p => p.theme.colors.palette.text.shade100};
  > :first-child {
    margin-right: 6px;
    border-radius: 50%;
  }

  > :nth-child(2),
  > :only-child {
    padding-right: 8px;
  }

  cursor: pointer;
`;

const Address = styled.div`
  user-select: pointer;
  flex: 1.5;
  > :first-child {
    margin-right: 8px;
  }
`;

const Base = styled.div`
  flex: 1;
`;

const CTA = styled.div`
  flex: 0.5;
  display: flex;
  justify-content: flex-end;
`;

const Value: ThemedComponent<{}> = styled.div`
  width: 30%;
  box-sizing: border-box;
  justify-content: flex-start;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Row = ({ account, parentAccount, delegation }: Props) => {
  const unit = getAccountUnit(account);
  const currency = getAccountCurrency(account);

  const mainAccount = getMainAccount(account, parentAccount);

  let name = "";
  if (delegation && delegation.poolId) {
    name = delegation.ticker
      ? delegation.ticker + " - " + delegation.name
      : shortAddressPreview(delegation.poolId);
  }
  // const diffInDays = useMemo(() => moment().diff(delegation.operation.date, "days"), [
  //   delegation.operation.date,
  // ]);

  const explorerView = getDefaultExplorerView(mainAccount.currency);
  const poolUrl = getAddressExplorer(explorerView, delegation.poolId);
  const totalStaked = account.balance.plus(delegation.rewards);

  const openPool = useCallback(() => {
    if (poolUrl) openURL(poolUrl);
  }, [poolUrl]);

  return (
    <Wrapper>
      <Value>
        <Text ff="Inter|SemiBold" color="palette.text.shade60" fontSize={3}>
          {name}
        </Text>
      </Value>
      <Value>
        <FormattedVal
          ff="Inter|SemiBold"
          val={totalStaked}
          unit={unit}
          showCode
          fontSize={3}
          color="palette.text.shade80"
        />
      </Value>
      <Value>
        <FormattedVal
          ff="Inter|SemiBold"
          val={delegation.rewards}
          unit={unit}
          showCode
          fontSize={3}
          color="palette.text.shade80"
        />
      </Value>
      <CTA>
        <ContextMenu account={account} parentAccount={parentAccount} />
      </CTA>
    </Wrapper>
  );
};

export default Row;
