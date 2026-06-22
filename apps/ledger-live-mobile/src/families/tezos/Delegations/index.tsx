import React, { useCallback, useMemo, useState } from "react";
import { Linking, StyleSheet, View } from "react-native";
import { differenceInCalendarDays } from "date-fns";
import { useNavigation, useTheme } from "@react-navigation/native";
import { Trans, useTranslation } from "~/context/Locale";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { getAccountCurrency, shortAddressPreview } from "@ledgerhq/live-common/account/index";
import {
  getAddressExplorer,
  getDefaultExplorerView,
  getTransactionExplorer,
} from "@ledgerhq/live-common/explorers";
import {
  isFinalizablePosition,
  useBaker,
  useTezosStakingInfo,
} from "@ledgerhq/live-common/families/tezos/react";
import type { StakingPosition } from "@ledgerhq/live-common/families/tezos/types";
import type { AccountLike } from "@ledgerhq/types-live";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import AccountDelegationInfo from "~/components/AccountDelegationInfo";
import AccountSectionLabel from "~/components/AccountSectionLabel";
import { Icons } from "@ledgerhq/native-ui";
import DelegationDrawer, {
  type FieldType,
  type Action,
  type IconProps,
} from "~/components/DelegationDrawer";
import Circle from "~/components/Circle";
import LText from "~/components/LText";
import Touchable from "~/components/Touchable";
import IlluRewards from "~/icons/images/Rewards";
import { NavigatorName, ScreenName } from "~/const";
import { urls } from "~/utils/urls";
import { useAccountName } from "~/reducers/wallet";
import { rgba } from "~/colors";
import UnstakeRequiredDrawer, { type UnstakeRequiredReason } from "../UnstakeRequiredDrawer";
import BakerImage from "../BakerImage";
import DelegationRow from "./Row";
import UnstakingRow from "./UnstakingRow";

type Props = Readonly<{
  account: AccountLike;
}>;

type Navigation = StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.Account>;

type Selected =
  | { kind: "stake" }
  | { kind: "delegation" }
  | { kind: "unstaking"; position: StakingPosition };

const daysSince = (d: Date | string | undefined | null) =>
  d ? differenceInCalendarDays(Date.now(), new Date(d)) : 0;

const DAY_MS = 24 * 60 * 60 * 1000;
// Unstaked tez finalize ~4 days after the request, then become withdrawable.
const UNSTAKE_DELAY_MS = 4 * DAY_MS;

const makeActionIcon =
  (
    Icon: React.ComponentType<{ size?: "XS" | "S" | "M" | "L" | "XL" | "XXL"; color?: string }>,
    color: string,
  ) =>
  (props: IconProps) => (
    <Circle {...props} bg={rgba(color, 0.2)}>
      <Icon size="S" color={color} />
    </Circle>
  );

export default function TezosDelegation({ account }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation<Navigation["navigation"]>();
  const info = useTezosStakingInfo(account);
  const unit = useAccountUnit(account);
  const currency = getAccountCurrency(account);
  const fallbackBaker = useBaker(info.delegation?.address || info.delegateAddress || "");
  const accountName = useAccountName(account);

  const [selected, setSelected] = useState<Selected | undefined>();
  const onCloseDrawer = useCallback(() => setSelected(undefined), []);
  const [unstakeRequired, setUnstakeRequired] = useState<UnstakeRequiredReason | null>(null);

  const currentBaker = info.delegation?.baker ?? fallbackBaker;
  const currentAddress = info.delegateAddress ?? "";

  const selectedUnstakingAddress =
    selected?.kind === "unstaking" ? (selected.position.delegate ?? "") : "";
  const selectedUnstakingBaker = useBaker(selectedUnstakingAddress);
  const drawerBaker = selected?.kind === "unstaking" ? selectedUnstakingBaker : currentBaker;
  const drawerAddress = selected?.kind === "unstaking" ? selectedUnstakingAddress : currentAddress;

  const ops = useMemo(
    () => (account.type === "Account" ? (account.operations ?? []) : []),
    [account],
  );
  const stakeDays = daysSince(ops.find(o => o?.type === "STAKE")?.date);
  const delegationDays = daysSince(
    info.delegation?.operation.date ?? ops.find(o => o?.type === "DELEGATE")?.date,
  );

  const onDelegate = useCallback(() => {
    if (account.type !== "Account") return;
    navigation.navigate(NavigatorName.TezosDelegationFlow, {
      screen: ScreenName.DelegationStarted,
      params: { accountId: account.id },
    });
  }, [account, navigation]);

  const onStakeMore = useCallback(() => {
    setSelected(undefined);
    navigation.navigate(NavigatorName.TezosStakeFlow, {
      screen: ScreenName.TezosStakeAmount,
      params: { accountId: account.id },
    });
  }, [navigation, account.id]);

  const onUnstake = useCallback(() => {
    setSelected(undefined);
    navigation.navigate(NavigatorName.TezosUnstakeFlow, {
      screen: ScreenName.TezosUnstakeAmount,
      params: { accountId: account.id },
    });
  }, [navigation, account.id]);

  const onChangeBaker = useCallback(() => {
    setSelected(undefined);
    if (info.isStaked) {
      setUnstakeRequired("changeBaker");
      return;
    }
    navigation.navigate(NavigatorName.TezosDelegationFlow, {
      screen: ScreenName.DelegationSummary,
      params: { accountId: account.id },
    });
  }, [info.isStaked, navigation, account.id]);

  const onEndDelegation = useCallback(() => {
    setSelected(undefined);
    if (info.isStaked) {
      setUnstakeRequired("endDelegation");
      return;
    }
    navigation.navigate(NavigatorName.TezosDelegationFlow, {
      screen: ScreenName.DelegationSummary,
      params: { accountId: account.id, mode: "undelegate" },
    });
  }, [info.isStaked, navigation, account.id]);

  const onOpenExplorer = useCallback(() => {
    if (account.type !== "Account" || !drawerAddress) return;
    const url = getAddressExplorer(getDefaultExplorerView(account.currency), drawerAddress);
    if (url) Linking.openURL(url);
  }, [account, drawerAddress]);

  const openTxExplorer = useCallback(
    (hash: string) => {
      if (account.type !== "Account") return;
      const url = getTransactionExplorer(getDefaultExplorerView(account.currency), hash);
      if (url) Linking.openURL(url);
    },
    [account],
  );

  const validatorField: FieldType = useMemo(
    () => ({
      label: t("delegation.validator"),
      Component: (
        <LText numberOfLines={1} semiBold ellipsizeMode="middle" style={styles.fieldValue}>
          {drawerBaker?.name ?? shortAddressPreview(drawerAddress)}
        </LText>
      ),
    }),
    [t, drawerBaker, drawerAddress],
  );

  const durationField = useCallback(
    (days: number): FieldType => ({
      label: t("delegation.duration"),
      Component: (
        <LText semiBold style={styles.fieldValue}>
          {days ? (
            <Trans i18nKey="delegation.durationDays" count={days} values={{ count: days }} />
          ) : (
            <Trans i18nKey="delegation.durationDays0" />
          )}
        </LText>
      ),
    }),
    [t],
  );

  const transactionIdField = useCallback(
    (hash: string): FieldType => ({
      label: t("delegation.transactionID"),
      Component: (
        <Touchable event="TezosOpenTransactionExplorer" onPress={() => openTxExplorer(hash)}>
          <LText
            numberOfLines={1}
            semiBold
            ellipsizeMode="middle"
            style={styles.fieldValue}
            color="live"
          >
            {shortAddressPreview(hash)}
          </LText>
        </Touchable>
      ),
    }),
    [t, openTxExplorer],
  );

  const buildUnstakingFields = useCallback(
    (pos: StakingPosition): FieldType[] => {
      const finalizable = isFinalizablePosition(pos.uid);
      const createdMs = pos.createdAt ? new Date(pos.createdAt).getTime() : undefined;
      const msLeft = createdMs === undefined ? 0 : createdMs + UNSTAKE_DELAY_MS - Date.now();
      const daysLeft = Math.ceil(msLeft / DAY_MS);

      const fields: FieldType[] = [
        validatorField,
        {
          label: t("tezos.staking.status"),
          Component: (
            <LText semiBold style={styles.fieldValue}>
              {t(finalizable ? "tezos.staking.available" : "tezos.staking.unstaking")}
            </LText>
          ),
        },
      ];

      if (createdMs !== undefined) {
        const txHash = ops.find(
          o => o?.type === "UNSTAKE" && new Date(o.date).getTime() === createdMs,
        )?.hash;
        if (txHash) fields.push(transactionIdField(txHash));
      }

      if (!finalizable && msLeft > 0) {
        fields.push({
          label: t("tezos.staking.availableIn"),
          Component: (
            <LText semiBold style={styles.fieldValue}>
              {msLeft >= DAY_MS ? (
                <Trans
                  i18nKey="delegation.durationDays"
                  count={daysLeft}
                  values={{ count: daysLeft }}
                />
              ) : (
                t("tezos.staking.lessThanADay")
              )}
            </LText>
          ),
        });
      }

      return fields;
    },
    [ops, validatorField, transactionIdField, t],
  );

  const drawerData = useMemo<FieldType[]>(() => {
    if (!selected) return [];
    if (selected.kind === "unstaking") return buildUnstakingFields(selected.position);

    const delegationHash = info.delegation?.operation.hash;
    const fields: FieldType[] = [
      validatorField,
      {
        label: t("delegation.validatorAddress"),
        Component: (
          <Touchable event="TezosDelegationOpenExplorer" onPress={onOpenExplorer}>
            <LText
              numberOfLines={1}
              semiBold
              ellipsizeMode="middle"
              style={styles.fieldValue}
              color="live"
            >
              {drawerAddress}
            </LText>
          </Touchable>
        ),
      },
    ];

    if (selected.kind === "delegation" && delegationHash) {
      fields.push(transactionIdField(delegationHash));
    }

    fields.push(
      {
        label: t("delegation.delegatedAccount"),
        Component: (
          <LText numberOfLines={1} semiBold ellipsizeMode="middle" style={styles.fieldValue}>
            {accountName}
          </LText>
        ),
      },
      durationField(selected.kind === "stake" ? stakeDays : delegationDays),
    );

    return fields;
  }, [
    selected,
    t,
    validatorField,
    durationField,
    transactionIdField,
    onOpenExplorer,
    drawerAddress,
    accountName,
    stakeDays,
    delegationDays,
    info.delegation,
    buildUnstakingFields,
  ]);

  const drawerActions = useMemo<Action[]>(() => {
    if (selected?.kind === "stake") {
      return [
        {
          label: t("tezos.staking.stakeMore"),
          Icon: makeActionIcon(Icons.Plus, colors.live),
          event: "TezosStakeMore",
          onPress: onStakeMore,
        },
        {
          label: t("tezos.staking.unstake"),
          Icon: makeActionIcon(Icons.ArrowDown, colors.live),
          event: "TezosUnstake",
          onPress: onUnstake,
        },
      ];
    }
    if (selected?.kind === "delegation") {
      return [
        {
          label: t("delegation.changeValidator"),
          Icon: makeActionIcon(Icons.PenEdit, colors.live),
          event: "TezosChangeBaker",
          onPress: onChangeBaker,
        },
        {
          label: t("delegation.endDelegation"),
          Icon: makeActionIcon(Icons.Trash, colors.alert),
          event: "TezosEndDelegation",
          onPress: onEndDelegation,
        },
      ];
    }
    return [];
  }, [
    selected?.kind,
    t,
    colors.live,
    colors.alert,
    onStakeMore,
    onUnstake,
    onChangeBaker,
    onEndDelegation,
  ]);

  if (account.type !== "Account") return null;

  if (!info.isStaked && !info.isDelegated && !info.hasUnstaking) {
    return (
      <View style={styles.root}>
        <AccountDelegationInfo
          title={t("account.delegation.info.title")}
          image={<IlluRewards style={styles.illustration} />}
          description={t("account.delegation.delegationEarn", { name: account.currency.name })}
          infoUrl={urls.delegation}
          infoTitle={t("account.delegation.howItWorks")}
          onPress={onDelegate}
          ctaTitle={t("account.delegation.info.cta")}
        />
      </View>
    );
  }

  let drawerAmount = info.availableBalance;
  if (selected?.kind === "unstaking") drawerAmount = selected.position.amount;
  else if (selected?.kind === "stake") drawerAmount = info.stakedBalance;

  const unstakingPositions = info.unstakingPositions;
  const showStaking = info.isStaked || unstakingPositions.length > 0;
  const lastUnstakingIndex = unstakingPositions.length - 1;

  return (
    <View style={styles.root}>
      {showStaking && (
        <View>
          <AccountSectionLabel name={t("tezos.staking.sectionLabel")} />
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            {info.isStaked && (
              <DelegationRow
                baker={currentBaker}
                address={currentAddress}
                amount={info.stakedBalance}
                unit={unit}
                currency={currency}
                onPress={() => setSelected({ kind: "stake" })}
                isLast={unstakingPositions.length === 0}
              />
            )}
            {unstakingPositions.map((position, i) => (
              <UnstakingRow
                key={position.uid}
                position={position}
                unit={unit}
                currency={currency}
                onPress={() => setSelected({ kind: "unstaking", position })}
                isLast={i === lastUnstakingIndex}
              />
            ))}
          </View>
        </View>
      )}

      {info.isDelegated && (
        <View style={showStaking ? styles.spacedTop : undefined}>
          <AccountSectionLabel name={t("tezos.delegation.sectionLabel")} />
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <DelegationRow
              baker={currentBaker}
              address={currentAddress}
              amount={info.availableBalance}
              unit={unit}
              currency={currency}
              onPress={() => setSelected({ kind: "delegation" })}
              isLast
            />
          </View>
        </View>
      )}

      <DelegationDrawer
        isOpen={!!selected}
        onClose={onCloseDrawer}
        account={account}
        ValidatorImage={({ size }) => <BakerImage size={size} baker={drawerBaker} />}
        amount={drawerAmount}
        data={drawerData}
        actions={drawerActions}
      />

      <UnstakeRequiredDrawer
        isOpen={unstakeRequired !== null}
        reason={unstakeRequired ?? "changeBaker"}
        onClose={() => setUnstakeRequired(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    padding: 16,
  },
  illustration: {
    alignSelf: "center",
    marginBottom: 16,
  },
  spacedTop: {
    marginTop: 24,
  },
  card: {
    borderRadius: 4,
    marginTop: 12,
  },
  fieldValue: {
    fontSize: 14,
  },
});
