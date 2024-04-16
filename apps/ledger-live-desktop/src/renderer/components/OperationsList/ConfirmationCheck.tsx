import React, { PureComponent } from "react";
import styled, { DefaultTheme, ThemedStyledProps } from "styled-components";
import { OperationType } from "@ledgerhq/types-live";
import { rgba, mix } from "~/renderer/styles/helpers";
import { TFunction } from "i18next";
import IconClock from "~/renderer/icons/Clock";
import IconReceive from "~/renderer/icons/Receive";
import IconDelegate from "~/renderer/icons/Delegate";
import IconUndelegate from "~/renderer/icons/Undelegate";
import IconRedelegate from "~/renderer/icons/Redelegate";
import IconSend from "~/renderer/icons/Send";
import IconPlus from "~/renderer/icons/Plus";
import IconEye from "~/renderer/icons/Eye";
import IconFees from "~/renderer/icons/Fees";
import IconTrash from "~/renderer/icons/Trash";
import IconLink from "~/renderer/icons/LinkIcon";
import IconCoins from "~/renderer/icons/Coins";
import Freeze from "~/renderer/icons/Freeze";
import Unfreeze from "~/renderer/icons/Unfreeze";
import Box from "~/renderer/components/Box";
import Tooltip from "~/renderer/components/Tooltip";
import ClaimRewards from "~/renderer/icons/ClaimReward";
import Vote from "~/renderer/icons/Vote";
import VoteNay from "~/renderer/icons/VoteNay";

const border = (p: ThemedStyledProps<ContainerProps, DefaultTheme>) =>
  p.hasFailed
    ? `1px solid ${p.theme.colors.alertRed}`
    : p.isConfirmed
    ? 0
    : `1px solid ${
        p.type === "IN" || p.type === "NFT_IN"
          ? p.theme.colors.warning
          : rgba(p.theme.colors.palette.text.shade60, 0.2)
      }`;
function inferColor(p: ThemedStyledProps<ContainerProps, DefaultTheme>) {
  switch (p.type) {
    case "IN":
    case "NFT_IN":
      return p.isConfirmed ? p.marketColor : p.theme.colors.warning;
    case "FREEZE":
      return p.theme.colors.wallet;
    case "REWARD":
      return p.theme.colors.gold;
    default:
      return p.theme.colors.palette.text.shade60;
  }
}

type ContainerProps = {
  isConfirmed: boolean;
  type: string;
  marketColor: string;
  hasFailed?: boolean;
};

export const Container = styled(Box).attrs<ContainerProps>(p => ({
  bg: p.hasFailed
    ? mix(p.theme.colors.alertRed, p.theme.colors.palette.background.paper, 0.95)
    : p.isConfirmed
    ? mix(inferColor(p) as string, p.theme.colors.palette.background.paper, 0.8)
    : p.theme.colors.palette.background.paper,
  color: p.hasFailed ? p.theme.colors.alertRed : inferColor(p),
  alignItems: "center",
  justifyContent: "center",
}))<ContainerProps>`
  border: ${border};
  border-radius: 50%;
  position: relative;
  height: 24px;
  width: 24px;
`;
const WrapperClock = styled(Box).attrs(() => ({
  bg: "palette.background.paper",
  color: "palette.text.shade60",
}))`
  border-radius: 50%;
  position: absolute;
  bottom: -4px;
  right: -4px;
  padding: 1px;
`;
const iconsComponent = {
  OUT: IconSend,
  IN: IconReceive,
  NFT_OUT: IconSend,
  NFT_IN: IconReceive,
  DELEGATE: IconDelegate,
  REDELEGATE: IconRedelegate,
  UNDELEGATE: IconUndelegate,
  REVEAL: IconEye,
  CREATE: IconPlus,
  NONE: IconSend,
  FREEZE: Freeze,
  UNFREEZE: Unfreeze,
  LEGACY_UNFREEZE: Unfreeze,
  UNDELEGATE_RESOURCE: IconUndelegate,
  WITHDRAW_EXPIRE_UNFREEZE: ClaimRewards,
  VOTE: Vote,
  REWARD: ClaimRewards,
  FEES: IconFees,
  OPT_IN: IconPlus,
  OPT_OUT: IconTrash,
  CLOSE_ACCOUNT: IconTrash,
  APPROVE: IconPlus,
  BOND: IconLink,
  UNBOND: IconUndelegate,
  WITHDRAW_UNBONDED: IconCoins,
  SLASH: IconTrash,
  NOMINATE: Vote,
  CHILL: VoteNay,
  REWARD_PAYOUT: ClaimRewards,
  SET_CONTROLLER: IconSend,
  LOCK: IconLink,
  UNLOCK: IconUndelegate,
  WITHDRAW: ClaimRewards,
  REVOKE: VoteNay,
  ACTIVATE: Vote,
  REGISTER: IconPlus,
  STAKE: IconDelegate,
  UNSTAKE: IconUndelegate,
  WITHDRAW_UNSTAKED: IconCoins,
};
class ConfirmationCheck extends PureComponent<{
  marketColor: string;
  isConfirmed: boolean;
  t: TFunction;
  type: OperationType;
  withTooltip?: boolean;
  hasFailed?: boolean;
  style?: React.CSSProperties;
}> {
  static defaultProps = {
    withTooltip: true,
  };

  renderTooltip = () => {
    const { t, isConfirmed } = this.props;
    return t(isConfirmed ? "operationDetails.confirmed" : "operationDetails.notConfirmed");
  };

  render() {
    const { marketColor, isConfirmed, t, type, withTooltip, hasFailed, ...props } = this.props;
    const Icon = iconsComponent[type];
    const content = (
      <Container
        {...props}
        type={type}
        isConfirmed={isConfirmed}
        marketColor={marketColor}
        hasFailed={hasFailed}
      >
        {Icon ? <Icon size={12} /> : null}
        {!isConfirmed && !hasFailed && (
          <WrapperClock>
            <IconClock size={10} />
          </WrapperClock>
        )}
      </Container>
    );
    return withTooltip ? (
      <Tooltip
        content={t(
          hasFailed
            ? "operationDetails.failed"
            : isConfirmed
            ? "operationDetails.confirmed"
            : "operationDetails.notConfirmed",
        )}
      >
        {content}
      </Tooltip>
    ) : (
      content
    );
  }
}
export default ConfirmationCheck;
