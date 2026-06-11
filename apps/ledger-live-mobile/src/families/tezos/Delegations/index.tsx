import React, { useCallback, useMemo, useState } from "react";
import { Linking, StyleSheet, View } from "react-native";
import { differenceInCalendarDays } from "date-fns";
import { useNavigation, useTheme } from "@react-navigation/native";
import { Trans, useTranslation } from "~/context/Locale";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { getAccountCurrency, shortAddressPreview } from "@ledgerhq/live-common/account/index";
import { getAddressExplorer, getDefaultExplorerView } from "@ledgerhq/live-common/explorers";
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
import DelegationDrawer, { type FieldType } from "~/components/DelegationDrawer";
import LText from "~/components/LText";
import Touchable from "~/components/Touchable";
import IlluRewards from "~/icons/images/Rewards";
import { NavigatorName, ScreenName } from "~/const";
import { urls } from "~/utils/urls";
import { useAccountName } from "~/reducers/wallet";
import BakerImage from "../BakerImage";
import DelegationRow from "./Row";
import LabelRight from "./LabelRight";
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

  const currentBaker = info.delegation?.baker ?? fallbackBaker;
  const currentAddress = info.delegateAddress ?? "";

  const selectedUnstakingAddress =
    selected?.kind === "unstaking" ? (selected.position.delegate ?? "") : "";
  const selectedUnstakingBaker = useBaker(selectedUnstakingAddress);
  const drawerBaker = selected?.kind === "unstaking" ? selectedUnstakingBaker : currentBaker;
  const drawerAddress = selected?.kind === "unstaking" ? selectedUnstakingAddress : currentAddress;

  const ops = account.type === "Account" ? (account.operations ?? []) : [];
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

  // Section "manage" CTAs are visible but inert until the stake / unstake flows land.
  const onManageStub = useCallback(() => undefined, []);

  const onOpenExplorer = useCallback(() => {
    if (account.type !== "Account" || !drawerAddress) return;
    const url = getAddressExplorer(getDefaultExplorerView(account.currency), drawerAddress);
    if (url) Linking.openURL(url);
  }, [account, drawerAddress]);

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

  const drawerData = useMemo<FieldType[]>(() => {
    if (!selected) return [];

    if (selected.kind === "unstaking") {
      const pos = selected.position;
      const finalizable = isFinalizablePosition(pos.uid);
      return [
        validatorField,
        {
          label: t("tezos.staking.status"),
          Component: (
            <LText semiBold style={styles.fieldValue}>
              {t(finalizable ? "tezos.staking.available" : "tezos.staking.unstaking")}
            </LText>
          ),
        },
        durationField(daysSince(pos.createdAt)),
      ];
    }

    return [
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
      {
        label: t("delegation.delegatedAccount"),
        Component: (
          <LText numberOfLines={1} semiBold ellipsizeMode="middle" style={styles.fieldValue}>
            {accountName}
          </LText>
        ),
      },
      durationField(selected.kind === "stake" ? stakeDays : delegationDays),
    ];
  }, [
    selected,
    t,
    validatorField,
    durationField,
    onOpenExplorer,
    drawerAddress,
    accountName,
    stakeDays,
    delegationDays,
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
          <AccountSectionLabel
            name={t("tezos.staking.sectionLabel")}
            RightComponent={
              <LabelRight disabled onPress={onManageStub} label={t("tezos.manage")} />
            }
          />
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
          <AccountSectionLabel
            name={t("tezos.delegation.sectionLabel")}
            RightComponent={
              <LabelRight disabled onPress={onManageStub} label={t("tezos.manage")} />
            }
          />
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
        actions={[]}
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
