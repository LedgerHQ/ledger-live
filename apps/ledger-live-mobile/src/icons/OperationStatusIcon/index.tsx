import React from "react";
import { OperationType } from "@ledgerhq/types-live";
import { IconsLegacy, BoxedIcon } from "@ledgerhq/native-ui";
import {
  DEFAULT_BOX_SIZE,
  DEFAULT_ICON_SIZE,
  DEFAULT_BADGE_SIZE,
} from "@ledgerhq/native-ui/components/Icon/BoxedIcon";

const iconsComponent = {
  OUT: IconsLegacy.ArrowTopMedium,
  IN: IconsLegacy.ArrowBottomMedium,
  DELEGATE: IconsLegacy.HandshakeMedium,
  REDELEGATE: IconsLegacy.DelegateMedium,
  UNDELEGATE: IconsLegacy.UndelegateMedium,
  REVEAL: IconsLegacy.EyeMedium,
  CREATE: IconsLegacy.PlusMedium,
  NONE: IconsLegacy.ArrowFromBottomMedium,
  FREEZE: IconsLegacy.FreezeMedium,
  UNFREEZE: IconsLegacy.UnfreezeMedium,
  UNDELEGATE_RESOURCE: IconsLegacy.UndelegateMedium,
  WITHDRAW_EXPIRE_UNFREEZE: IconsLegacy.CoinsMedium,
  LEGACY_UNFREEZE: IconsLegacy.UnfreezeMedium,
  VOTE: IconsLegacy.VoteMedium,
  REWARD: IconsLegacy.StarMedium,
  FEES: IconsLegacy.FeesMedium,
  OPT_IN: IconsLegacy.PlusMedium,
  OPT_OUT: IconsLegacy.TrashMedium,
  CLOSE_ACCOUNT: IconsLegacy.TrashMedium,
  APPROVE: IconsLegacy.PlusMedium,
  BOND: IconsLegacy.LinkMedium,
  UNBOND: IconsLegacy.LinkNoneMedium,
  WITHDRAW_UNBONDED: IconsLegacy.CoinsMedium,
  SLASH: IconsLegacy.TrashMedium,
  NOMINATE: IconsLegacy.VoteMedium,
  CHILL: IconsLegacy.VoteMedium,
  REWARD_PAYOUT: IconsLegacy.ClaimRewardsMedium,
  SET_CONTROLLER: IconsLegacy.ArrowFromBottomMedium,
  NFT_IN: IconsLegacy.ArrowBottomMedium,
  NFT_OUT: IconsLegacy.ArrowTopMedium,
  ACTIVATE: IconsLegacy.ShieldCheckMedium,
  LOCK: IconsLegacy.LockMedium,
  UNLOCK: IconsLegacy.UnlockMedium,
  REVOKE: IconsLegacy.VoteNoneMedium,
  REGISTER: IconsLegacy.PlusMedium,
  STAKE: IconsLegacy.HandshakeMedium,
  UNSTAKE: IconsLegacy.UndelegateMedium,
  WITHDRAW_UNSTAKED: IconsLegacy.CoinsMedium,
};

const OperationStatusIcon = ({
  type,
  confirmed,
  failed,
  Badge,
  size = 24,
}: {
  size?: number;
  type: OperationType;
  confirmed?: boolean;
  Badge?: React.ComponentType<{ size?: number; color?: string }>;
  failed?: boolean;
}) => {
  const Icon = iconsComponent[type as keyof typeof iconsComponent] || iconsComponent.NONE;
  const BadgeIcon =
    Badge ||
    (failed
      ? IconsLegacy.CircledCrossSolidMedium
      : confirmed
      ? undefined
      : IconsLegacy.HistoryMedium);
  const borderColor = failed ? "error.c40" : confirmed ? "neutral.c40" : "warning.c40";
  const iconColor = failed ? "error.c50" : confirmed ? "neutral.c100" : "warning.c50";
  const badgeColor = failed ? "error.c50" : "neutral.c70";
  return (
    <BoxedIcon
      Icon={Icon}
      Badge={BadgeIcon}
      size={size}
      iconSize={(size * DEFAULT_ICON_SIZE) / DEFAULT_BOX_SIZE}
      badgeSize={(size * DEFAULT_BADGE_SIZE) / DEFAULT_BOX_SIZE}
      borderColor={borderColor}
      iconColor={iconColor}
      badgeColor={badgeColor}
    />
  );
};

export default React.memo(OperationStatusIcon);
