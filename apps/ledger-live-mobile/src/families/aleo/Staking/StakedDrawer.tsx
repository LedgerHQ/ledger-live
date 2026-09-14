import React, { useMemo } from "react";
import { Text } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import { useTranslation } from "~/context/Locale";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import type { AleoStakingPosition } from "@ledgerhq/live-common/families/aleo/react";
import DelegationDrawer, {
  type Action,
  type FieldType,
  type IconProps,
} from "~/components/DelegationDrawer";
import Circle from "~/components/Circle";
import DelegateIcon from "~/icons/Delegate";
import UndelegateIcon from "~/icons/Undelegate";
import { rgba } from "~/colors";
import ValidatorImage from "../../cosmos/shared/ValidatorImage";
import { useValidatorFields } from "./useValidatorFields";

type Props = {
  account: AleoAccount;
  position: AleoStakingPosition;
  isOpen: boolean;
  onClose: () => void;
  onBond: () => void;
  onUnstake: () => void;
};

export default function StakedDrawer({
  account,
  position,
  isOpen,
  onClose,
  onBond,
  onUnstake,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const {
    hasBonded,
    bondedBalance,
    validatorLabel,
    nonEarningReason,
    estimatedRate,
    hasPendingUnbond,
    hasPendingUnbondingChange,
  } = position;

  // Aleo tracks a single unbonding position, so anything in flight blocks a new unbond.
  const canUnstake = hasBonded && !hasPendingUnbondingChange;
  const validatorFields = useValidatorFields(account, position);

  const actions = useMemo<Action[]>(
    () => [
      {
        label: t("aleo.manage.bond"),
        Icon: (props: IconProps) => (
          <Circle {...props} bg={rgba(colors.yellow, 0.2)}>
            <DelegateIcon color={colors.yellow} />
          </Circle>
        ),
        event: "AleoManageBond",
        onPress: onBond,
      },
      {
        label: t("aleo.manage.unbond"),
        Icon: (props: IconProps) => (
          <Circle {...props} bg={canUnstake ? rgba(colors.alert, 0.2) : colors.lightFog}>
            <UndelegateIcon color={canUnstake ? colors.alert : colors.grey} />
          </Circle>
        ),
        event: "AleoManageUnstake",
        disabled: !canUnstake,
        onPress: onUnstake,
      },
    ],
    [t, colors, canUnstake, onBond, onUnstake],
  );

  const data = useMemo<FieldType[]>(() => {
    const fields: FieldType[] = [
      ...validatorFields,
      {
        label: t("aleo.manage.status"),
        Component: (
          <Text
            variant="body"
            fontWeight="semiBold"
            color={nonEarningReason ? "warning.c70" : "neutral.c100"}
            testID="aleo-manage-status"
          >
            {nonEarningReason
              ? t(`aleo.stake.nonEarning.${nonEarningReason}`)
              : t("aleo.stake.status.earning")}
          </Text>
        ),
      },
      {
        label: t("aleo.manage.estimatedRate"),
        Component: (
          <Text variant="body" fontWeight="semiBold" testID="aleo-manage-rate">
            {estimatedRate === undefined
              ? "-"
              : t("aleo.stake.estimatedRate", { rate: (estimatedRate * 100).toFixed(1) })}
          </Text>
        ),
      },
    ];

    if (hasPendingUnbondingChange) {
      fields.push({
        label: t(
          hasPendingUnbond
            ? "aleo.stake.unstakingRow.unbondPending"
            : "aleo.stake.unstakingRow.claimPending",
        ),
        Component: (
          <Text variant="small" color="neutral.c70" testID="aleo-manage-pending-info">
            {t(hasPendingUnbond ? "aleo.manage.unbondPendingInfo" : "aleo.manage.claimPendingInfo")}
          </Text>
        ),
      });
    }

    return fields;
  }, [
    t,
    validatorFields,
    estimatedRate,
    nonEarningReason,
    hasPendingUnbondingChange,
    hasPendingUnbond,
  ]);

  return (
    <DelegationDrawer
      isOpen={isOpen}
      onClose={onClose}
      account={account}
      amount={bondedBalance}
      ValidatorImage={({ size }) => <ValidatorImage size={size} name={validatorLabel} />}
      data={data}
      actions={actions}
    />
  );
}
