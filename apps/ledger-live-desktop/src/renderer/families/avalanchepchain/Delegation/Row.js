import React from "react";
import { getAccountUnit } from "@ledgerhq/live-common/lib/account";
import { formatCurrencyUnit } from "@ledgerhq/live-common/lib/currencies";
import { BigNumber } from "bignumber.js";
import styled from "styled-components";
import { TableLine } from "./Header";
import { isDefaultValidatorNode } from "@ledgerhq/live-common/lib/families/avalanchepchain/utils";
import FirstLetterIcon from "~/renderer/components/FirstLetterIcon";
import Box from "~/renderer/components/Box";
import { IconContainer } from "~/renderer/components/Delegation/ValidatorRow";
import Logo from "~/renderer/icons/Logo";
import type { AvalancheDelegation } from "@ledgerhq/live-common/lib/families/avalanchepchain/types";
import moment from "moment";

const Wrapper: ThemedComponent<*> = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 16px 20px;
`;

const Column: ThemedComponent<{ clickable?: boolean }> = styled(TableLine).attrs(p => ({
  ff: "Inter|SemiBold",
  color: p.strong ? "palette.text.shade100" : "palette.text.shade80",
  fontSize: 3,
}))`
  cursor: ${p => (p.clickable ? "pointer" : "cursor")};
  ${p =>
    p.clickable
      ? `
      &:hover {
        color: ${p.theme.colors.palette.primary.main};
      }
      `
      : ``}
`;

const Ellipsis: ThemedComponent<{}> = styled.div`
  flex: 1;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

type Props = {
  account: Account,
  delegation: AvalancheDelegation,
  onManageAction: (delegation: AvalancheDelegation, action: string) => void,
  onExternalLink: (address: string) => void,
};

export function Row({ delegation, account, onExternalLink }: Props) {

  const onExternalLinkClick = () => onExternalLink(delegation.txID);

  const formatAmount = (amount: string) => {
    const unit = getAccountUnit(account);
    return formatCurrencyUnit(unit, new BigNumber(amount), {
      disableRounding: false,
      alwaysShowSign: false,
      showCode: true,
    });
  };

  return (
    <Wrapper>
      <Column strong clickable onClick={onExternalLinkClick}>
        <Box mr={1}>
          <IconContainer isSR>
            {isDefaultValidatorNode(delegation.nodeID) ? (
              <Logo size={16} />
            ) : (
              <FirstLetterIcon label={delegation.nodeID.split("-")[0]} />
            )}
          </IconContainer>
        </Box>
        <Ellipsis>{isDefaultValidatorNode(delegation.nodeID) ? `Ledger by Figment - ${delegation.nodeID}` : delegation.nodeID}</Ellipsis>
      </Column>
      <Column>{moment.unix(delegation.startTime).format('MM/DD/YYYY, h:mm:ss a')}</Column>
      <Column>{moment.unix(delegation.endTime).format('MM/DD/YYYY, h:mm:ss a')}</Column>
      <Column>{formatAmount(delegation.stakeAmount.toString())}</Column>
      <Column>{formatAmount(delegation.potentialReward.toString())}</Column>
    </Wrapper>
  );
}
