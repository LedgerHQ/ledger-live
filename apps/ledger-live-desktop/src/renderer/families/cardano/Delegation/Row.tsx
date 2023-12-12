import React from "react";
import styled from "styled-components";
import { getAccountUnit, shortAddressPreview } from "@ledgerhq/live-common/account/index";
import { CardanoAccount, CardanoDelegation } from "@ledgerhq/live-common/families/cardano/types";
import FormattedVal from "~/renderer/components/FormattedVal";
import Text from "~/renderer/components/Text";
import Ellipsis from "~/renderer/components/Ellipsis";
import ContextMenu from "./ContextMenu";

type Props = {
  delegation: CardanoDelegation;
  account: CardanoAccount;
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  padding: 16px 20px;
  opacity: 1;
  > * {
    display: flex;
    align-items: center;
    flex-direction: row;
    box-sizing: border-box;
  }
`;

const CTA = styled.div`
  flex: 0.5;
  display: flex;
  justify-content: flex-end;
`;

const Value = styled.div`
  width: 30%;
  box-sizing: border-box;
  justify-content: flex-start;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Row = ({ account, delegation }: Props) => {
  const unit = getAccountUnit(account);
  let name = "";
  if (delegation && delegation.poolId) {
    name = delegation.ticker
      ? delegation.ticker + " - " + delegation.name
      : shortAddressPreview(delegation.poolId);
  }
  return (
    <Wrapper>
      <Value>
        <Ellipsis fontSize={3} color="palette.text.shade60">
          <Text ff="Inter|SemiBold">{name}</Text>
        </Ellipsis>
      </Value>
      <Value>
        <FormattedVal
          ff="Inter|SemiBold"
          val={account.balance}
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
        <ContextMenu account={account} />
      </CTA>
    </Wrapper>
  );
};

export default Row;
