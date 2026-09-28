import React, { useMemo } from "react";
import { Text } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import { useTranslation } from "~/context/Locale";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import type {
  AleoAccount,
  AleoUnbondingDisplayState,
} from "@ledgerhq/live-common/families/aleo/types";
import type { AleoStakingPositionView } from "@ledgerhq/live-common/families/aleo/react";
import DelegationDrawer, {
  type Action,
  type FieldType,
  type IconProps,
} from "~/components/DelegationDrawer";
import Circle from "~/components/Circle";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import ClaimRewardIcon from "~/icons/ClaimReward";
import { rgba } from "~/colors";
import { makeValidatorImage } from "./ValidatorImage";
import { getUnbondingStatusLabel } from "./utils";

function makeClaimIcon(disabled: boolean) {
  return function ClaimIcon(props: Readonly<IconProps>) {
    const { colors } = useTheme();

    return (
      <Circle {...props} bg={disabled ? colors.lightFog : rgba(colors.yellow, 0.2)}>
        <ClaimRewardIcon color={disabled ? colors.grey : colors.yellow} />
      </Circle>
    );
  };
}

type Props = Readonly<{
  account: AleoAccount;
  position: AleoStakingPositionView;
  unbonding: AleoUnbondingDisplayState;
  isOpen: boolean;
  onClose: () => void;
  onClaim: () => void;
}>;

export default function UnstakingDrawer({
  account,
  position,
  unbonding,
  isOpen,
  onClose,
  onClaim,
}: Props) {
  const { t } = useTranslation();
  const unit = useAccountUnit(account);
  const { unbondingBalance, unbondingHeight, claimableBalance, hasPendingUnbondingChange } =
    position;

  // unbonding funds aren't tied to a validator anymore
  const ValidatorImage = useMemo(() => makeValidatorImage(unit.name), [unit.name]);

  // Aleo tracks one unbonding position at a time, so a pending unbond or claim locks the next one.
  const canClaim = claimableBalance.gt(0) && !hasPendingUnbondingChange;

  const actions = useMemo<Action[]>(
    () => [
      {
        label: t("aleo.manage.claim"),
        Icon: makeClaimIcon(!canClaim),
        event: "AleoManageClaim",
        disabled: !canClaim,
        onPress: onClaim,
      },
    ],
    [t, canClaim, onClaim],
  );

  const data = useMemo<FieldType[]>(() => {
    const fields: FieldType[] = [
      {
        label: t("aleo.manage.status"),
        Component: (
          <Text variant="body" fontWeight="semiBold" testID="aleo-unstaking-status">
            {getUnbondingStatusLabel(t, position, unbonding)}
          </Text>
        ),
      },
    ];

    if (unbondingHeight !== null) {
      fields.push({
        label: t("aleo.manage.unlockBlock"),
        Component: (
          <Text variant="body" fontWeight="semiBold" testID="aleo-unstaking-unlock-block">
            {unbondingHeight}
          </Text>
        ),
      });
    }

    if (claimableBalance.gt(0)) {
      fields.push({
        label: t("aleo.stake.claimable"),
        Component: (
          <Text variant="body" fontWeight="semiBold" testID="aleo-unstaking-claimable">
            <CurrencyUnitValue unit={unit} value={claimableBalance} showCode disableRounding />
          </Text>
        ),
      });
    }

    return fields;
  }, [t, unit, position, unbonding, unbondingHeight, claimableBalance]);

  return (
    <DelegationDrawer
      undelegation
      isOpen={isOpen}
      onClose={onClose}
      account={account}
      amount={unbondingBalance}
      ValidatorImage={ValidatorImage}
      data={data}
      actions={actions}
    />
  );
}
