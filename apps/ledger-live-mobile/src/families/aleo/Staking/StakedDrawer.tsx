import React, { useMemo } from "react";
import { StyleSheet } from "react-native";
import { Text } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import { useTranslation } from "~/context/Locale";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import type { AleoStakingPositionView } from "@ledgerhq/live-common/families/aleo/react";
import DelegationDrawer, {
  type Action,
  type FieldType,
  type IconProps,
} from "~/components/DelegationDrawer";
import Circle from "~/components/Circle";
import Skeleton from "~/components/Skeleton";
import DelegateIcon from "~/icons/Delegate";
import { rgba } from "~/colors";
import { makeValidatorImage } from "./ValidatorImage";
import { useValidatorFields } from "./useValidatorFields";
import { getStakedStatusLabel } from "./utils";

function BondIcon(props: Readonly<IconProps>) {
  const { colors } = useTheme();

  return (
    <Circle {...props} bg={rgba(colors.yellow, 0.2)}>
      <DelegateIcon color={colors.yellow} />
    </Circle>
  );
}

type Props = Readonly<{
  account: AleoAccount;
  position: AleoStakingPositionView;
  isOpen: boolean;
  onClose: () => void;
  onBond: () => void;
}>;

export default function StakedDrawer({ account, position, isOpen, onClose, onBond }: Props) {
  const { t } = useTranslation();
  const {
    bondedBalance,
    validatorLabel,
    nonEarningReason,
    estimatedRate,
    pendingKind,
    validatorsLoading,
  } = position;

  const validatorFields = useValidatorFields(account, position);
  const label = validatorLabel || t("aleo.stake.fallbackValidator");
  const ValidatorImage = useMemo(() => makeValidatorImage(label), [label]);

  const actions = useMemo<Action[]>(
    () => [
      {
        label: t("aleo.manage.bond"),
        Icon: BondIcon,
        event: "AleoManageBond",
        onPress: onBond,
      },
    ],
    [t, onBond],
  );

  const data = useMemo<FieldType[]>(() => {
    const fields: FieldType[] = [
      ...validatorFields,
      {
        label: t("aleo.manage.status"),
        Component: (
          <Skeleton loading={validatorsLoading} style={styles.statusSkeleton}>
            <Text
              variant="body"
              fontWeight="semiBold"
              color={nonEarningReason ? "warning.c70" : "neutral.c100"}
              testID="aleo-manage-status"
            >
              {getStakedStatusLabel(t, position)}
            </Text>
          </Skeleton>
        ),
      },
      {
        label: t("aleo.manage.estimatedRate"),
        Component: (
          <Skeleton loading={validatorsLoading} style={styles.rateSkeleton}>
            <Text variant="body" fontWeight="semiBold" testID="aleo-manage-rate">
              {estimatedRate === undefined
                ? "-"
                : t("aleo.stake.estimatedRate", { rate: (estimatedRate * 100).toFixed(1) })}
            </Text>
          </Skeleton>
        ),
      },
    ];

    if (pendingKind) {
      fields.push({
        label:
          pendingKind === "claim"
            ? t("aleo.stake.unstakingRow.claimPending")
            : t("aleo.stake.unstakingRow.unbondPending"),
        Component: (
          <Text variant="small" color="neutral.c70" testID="aleo-manage-pending-info">
            {pendingKind === "claim"
              ? t("aleo.manage.claimPendingInfo")
              : t("aleo.manage.unbondPendingInfo")}
          </Text>
        ),
      });
    }

    return fields;
  }, [
    t,
    position,
    validatorFields,
    estimatedRate,
    nonEarningReason,
    pendingKind,
    validatorsLoading,
  ]);

  return (
    <DelegationDrawer
      isOpen={isOpen}
      onClose={onClose}
      account={account}
      amount={bondedBalance}
      ValidatorImage={ValidatorImage}
      data={data}
      actions={actions}
    />
  );
}

const styles = StyleSheet.create({
  statusSkeleton: {
    width: 120,
    height: 16,
    borderRadius: 4,
  },
  rateSkeleton: {
    width: 64,
    height: 16,
    borderRadius: 4,
  },
});
