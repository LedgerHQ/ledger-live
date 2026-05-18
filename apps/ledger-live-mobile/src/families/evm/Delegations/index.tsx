import BigNumber from "bignumber.js";
import React, { useCallback, useState, useMemo } from "react";
import { View, StyleSheet, Linking } from "react-native";
import { useTheme } from "@react-navigation/native";
import { useTranslation } from "~/context/Locale";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/live-common/account/index";
import { getDefaultExplorerView, getAddressExplorer } from "@ledgerhq/live-common/explorers";
import {
  useEvmFamilyMappedDelegations,
  useEvmFamilyPreloadData,
} from "@ledgerhq/live-common/families/evm/staking/react";
import type {
  StakingAccount,
  StakingMappedDelegation,
  StakingMappedUnbonding,
} from "@ledgerhq/live-common/families/evm/staking/types";
import {
  mapUnbondings,
  canRedelegate,
  getRedelegation,
  canUndelegate,
  canDelegate,
} from "@ledgerhq/live-common/families/evm/staking/logic";
import { Text } from "@ledgerhq/native-ui";
import { AccountLike } from "@ledgerhq/types-live";
import AccountDelegationInfo from "~/components/AccountDelegationInfo";
import IlluRewards from "~/icons/images/Rewards";
import { urls } from "~/utils/urls";
import AccountSectionLabel from "~/components/AccountSectionLabel";
import DelegationDrawer from "~/components/DelegationDrawer";
import type { IconProps } from "~/components/DelegationDrawer";
import Touchable from "~/components/Touchable";
import { rgba } from "../../../colors";
import Circle from "~/components/Circle";
import LText from "~/components/LText";
import Button from "~/components/Button";
import RedelegateIcon from "~/icons/Redelegate";
import UndelegateIcon from "~/icons/Undelegate";
import ClaimRewardIcon from "~/icons/ClaimReward";
import DelegationRow from "./Row";
import DelegationLabelRight from "./LabelRight";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import CounterValue from "~/components/CounterValue";
import DateFromNow from "~/components/DateFromNow";
import ValidatorImage from "../shared/ValidatorImage";
import { useAccountName } from "~/reducers/wallet";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import { getCurrencyConfiguration } from "@ledgerhq/live-common/config/index";

type Props = {
  account: StakingAccount;
};

type DelegationDrawerProps = React.ComponentProps<typeof DelegationDrawer>;
type DelegationDrawerActions = DelegationDrawerProps["actions"];

function Delegations({ account }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const mainAccount = getMainAccount(account) as StakingAccount;
  const delegations: StakingMappedDelegation[] = useEvmFamilyMappedDelegations(mainAccount);
  const currency = getAccountCurrency(mainAccount);
  const unit = useAccountUnit(account);
  const { validators } = useEvmFamilyPreloadData(account.currency.id);

  const { stakingResources } = mainAccount;

  const undelegations =
    stakingResources &&
    stakingResources.unbondings &&
    mapUnbondings(stakingResources.unbondings, validators, unit);
  const [delegation, setDelegation] = useState<StakingMappedDelegation>();
  const [undelegation, setUndelegation] = useState<StakingMappedUnbonding>();

  const totalRewardsAvailable = delegations.reduce(
    (sum, d) => sum.plus(d.pendingRewards || 0),
    BigNumber(0),
  );

  const onDelegate = useCallback(() => {}, []);
  const onRedelegate = useCallback(() => {}, []);
  const onCollectRewards = useCallback(() => {}, []);
  const onUndelegate = useCallback(() => {}, []);

  const onCloseDrawer = useCallback(() => {
    setDelegation(undefined);
    setUndelegation(undefined);
  }, []);

  const onOpenExplorer = useCallback(
    (address: string) => {
      const url = getAddressExplorer(getDefaultExplorerView(account.currency), address);
      if (url) Linking.openURL(url);
    },
    [account.currency],
  );

  const accountName = useAccountName(account);

  const data = useMemo<DelegationDrawerProps["data"]>(() => {
    const d = delegation || undelegation;

    const redelegation = delegation && getRedelegation(account, delegation);

    return d
      ? [
          {
            label: t("delegation.validator"),
            Component: (
              <LText
                numberOfLines={1}
                semiBold
                ellipsizeMode="middle"
                style={[styles.valueText]}
                color="live"
              >
                {d.validator?.name ?? d.validatorAddress ?? ""}
              </LText>
            ),
          },
          {
            label: t("delegation.validatorAddress"),
            Component: (
              <Touchable
                onPress={() => onOpenExplorer(d.validatorAddress)}
                event="DelegationOpenExplorer"
              >
                <LText
                  numberOfLines={1}
                  semiBold
                  ellipsizeMode="middle"
                  style={[styles.valueText]}
                  color="live"
                >
                  {d.validatorAddress}
                </LText>
              </Touchable>
            ),
          },
          {
            label: t("delegation.delegatedAccount"),
            Component: (
              <LText
                numberOfLines={1}
                semiBold
                ellipsizeMode="middle"
                style={[styles.valueText]}
                color="live"
              >
                {accountName}{" "}
              </LText>
            ),
          },
          {
            label: t("evm.delegation.drawer.status"),
            Component: (
              <LText
                numberOfLines={1}
                semiBold
                ellipsizeMode="middle"
                style={[styles.valueText]}
                color="live"
              >
                {(d as StakingMappedDelegation).status === "bonded"
                  ? t("evm.delegation.drawer.active")
                  : t("evm.delegation.drawer.inactive")}
              </LText>
            ),
          },
          ...(delegation
            ? [
                {
                  label: t("evm.delegation.drawer.rewards"),
                  Component: (
                    <LText numberOfLines={1} semiBold style={[styles.valueText]}>
                      {delegation.formattedPendingRewards ?? ""}
                    </LText>
                  ),
                },
              ]
            : []),
          ...(undelegation
            ? [
                {
                  label: t("evm.delegation.drawer.completionDate"),
                  Component: (
                    <LText numberOfLines={1} semiBold>
                      <DateFromNow date={new Date(undelegation.completionDate).getTime()} />
                    </LText>
                  ),
                },
              ]
            : []),
          ...(redelegation
            ? [
                {
                  label: t("evm.delegation.drawer.redelegatedFrom"),
                  Component: (
                    <Touchable
                      onPress={() => onOpenExplorer(redelegation.validatorSrcAddress)}
                      event="DelegationOpenExplorer"
                    >
                      <LText
                        numberOfLines={1}
                        semiBold
                        ellipsizeMode="middle"
                        style={[styles.valueText]}
                        color="live"
                      >
                        {redelegation.validatorSrcAddress}
                      </LText>
                    </Touchable>
                  ),
                },
                {
                  label: t("evm.delegation.drawer.completionDate"),
                  Component: (
                    <LText numberOfLines={1} semiBold>
                      <DateFromNow date={new Date(redelegation.completionDate).getTime()} />
                    </LText>
                  ),
                },
              ]
            : []),
        ]
      : [];
  }, [delegation, t, account, accountName, onOpenExplorer, undelegation]);

  const actions = useMemo<DelegationDrawerActions>(() => {
    const rewardsDisabled = !delegation?.pendingRewards || delegation.pendingRewards.isZero();
    const redelegateEnabled = delegation && canRedelegate(account, delegation);

    const undelegationEnabled = canUndelegate(account);

    return delegation
      ? [
          {
            label: t("delegation.actions.redelegate"),
            Icon: (props: IconProps) => (
              <Circle {...props} bg={!redelegateEnabled ? colors.lightFog : colors.fog}>
                <RedelegateIcon color={!redelegateEnabled ? colors.grey : undefined} />
              </Circle>
            ),
            disabled: !redelegateEnabled,
            onPress: onRedelegate,
            event: "DelegationActionRedelegate",
          },
          {
            label: t("delegation.actions.collectRewards"),
            Icon: (props: IconProps) => (
              <Circle {...props} bg={rewardsDisabled ? colors.lightFog : rgba(colors.yellow, 0.2)}>
                <ClaimRewardIcon color={rewardsDisabled ? colors.grey : undefined} />
              </Circle>
            ),
            disabled: rewardsDisabled,
            onPress: onCollectRewards,
            event: "DelegationActionCollectRewards",
          },
          {
            label: t("delegation.actions.undelegate"),
            Icon: (props: IconProps) => (
              <Circle
                {...props}
                bg={!undelegationEnabled ? colors.lightFog : rgba(colors.alert, 0.2)}
              >
                <UndelegateIcon color={!undelegationEnabled ? colors.grey : undefined} />
              </Circle>
            ),
            disabled: !undelegationEnabled,
            onPress: onUndelegate,
            event: "DelegationActionUndelegate",
          },
        ]
      : [];
  }, [
    delegation,
    account,
    t,
    onRedelegate,
    onCollectRewards,
    onUndelegate,
    colors.lightFog,
    colors.fog,
    colors.grey,
    colors.yellow,
    colors.alert,
  ]);

  const delegationDisabled = delegations.length <= 0 || !canDelegate(account);

  return (
    <View style={styles.root}>
      <DelegationDrawer
        isOpen={data && data.length > 0}
        onClose={onCloseDrawer}
        account={account}
        ValidatorImage={({ size }) => (
          <ValidatorImage
            isLedger={false}
            name={
              (delegation || undelegation)?.validator?.name ??
              (delegation || undelegation)?.validatorAddress ??
              ""
            }
            size={size}
          />
        )}
        amount={delegation?.amount ?? new BigNumber(0)}
        data={data}
        actions={actions}
      />
      {totalRewardsAvailable.gt(0) && (
        <>
          <AccountSectionLabel name={t("account.claimReward.sectionLabel")} />
          <View style={[styles.rewardsWrapper]}>
            <View style={styles.column}>
              <Text fontWeight={"semiBold"} variant={"h4"}>
                <CurrencyUnitValue value={totalRewardsAvailable} unit={unit} />
              </Text>
              <LText semiBold style={styles.subLabel} color="grey">
                <CounterValue currency={currency} value={totalRewardsAvailable} withPlaceholder />
              </LText>
            </View>
            <Button
              event="EvmDelegation AccountClaimRewardsBtn Click"
              onPress={onCollectRewards}
              type="primary"
              title={t("account.claimReward.cta")}
            />
          </View>
        </>
      )}
      {delegations.length === 0 ? (
        <AccountDelegationInfo
          title={t("account.delegation.info.title")}
          image={<IlluRewards style={styles.illustration} />}
          description={t("evm.delegation.delegationEarn", {
            name: account.currency.name,
            ticker: account.currency.ticker,
          })}
          infoUrl={urls.evmNativeStaking}
          infoTitle={t("evm.delegation.info")}
          onPress={onDelegate}
          ctaTitle={t("account.delegation.info.cta")}
        />
      ) : (
        <View style={styles.wrapper}>
          <AccountSectionLabel
            name={t("account.delegation.sectionLabel")}
            RightComponent={
              <DelegationLabelRight disabled={delegationDisabled} onPress={onDelegate} />
            }
          />
          {delegations.map((d, i) => (
            <View key={d.validatorAddress} style={[styles.delegationsWrapper]}>
              <DelegationRow
                delegation={d}
                currency={currency}
                onPress={() => setDelegation(d)}
                isLast={i === delegations.length - 1}
              />
            </View>
          ))}
        </View>
      )}

      {undelegations && undelegations.length > 0 && (
        <View style={styles.wrapper}>
          <AccountSectionLabel name={t("account.undelegation.sectionLabel")} />
          {undelegations.map((d, i) => (
            <View
              key={d.validatorAddress}
              style={[styles.delegationsWrapper, { backgroundColor: colors.card }]}
            >
              <DelegationRow
                delegation={d}
                currency={currency}
                onPress={() => setUndelegation(d)}
                isLast={i === undelegations.length - 1}
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function EvmDelegations({ account }: { account: AccountLike<StakingAccount> }) {
  if (account.type !== "Account" || !account.stakingResources) return null;

  const coinConfig = getCurrencyConfiguration(account.currency.id);
  if ("disableDelegation" in coinConfig && coinConfig.disableDelegation === true) {
    return null;
  }

  return <Delegations account={account as StakingAccount} />;
}

const styles = StyleSheet.create({
  root: {
    marginHorizontal: 16,
  },
  illustration: { alignSelf: "center", marginBottom: 16 },
  rewardsWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignContent: "center",
    paddingVertical: 16,
    marginBottom: 16,

    borderRadius: 4,
  },
  label: {
    fontSize: 20,
    flex: 1,
  },
  subLabel: {
    fontSize: 14,

    flex: 1,
  },
  column: {
    flexDirection: "column",
  },
  wrapper: {},
  delegationsWrapper: {
    borderRadius: 4,
  },
  valueText: {
    fontSize: 14,
  },
  banner: {
    marginBottom: 16,
  },
});
