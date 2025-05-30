import { BigNumber } from "bignumber.js";
import React, { useCallback, useState, useMemo, useEffect } from "react";
import { View, StyleSheet, Linking } from "react-native";
import { useNavigation, useRoute, useTheme } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/live-common/account/index";
import { getDefaultExplorerView, getAddressExplorer } from "@ledgerhq/live-common/explorers";
import {
  useCosmosFamilyMappedDelegations,
  useCosmosFamilyPreloadData,
} from "@ledgerhq/live-common/families/cosmos/react";
import type {
  CosmosAccount,
  CosmosMappedDelegation,
  CosmosMappedUnbonding,
} from "@ledgerhq/live-common/families/cosmos/types";
import {
  mapUnbondings,
  canRedelegate,
  getRedelegation,
  canUndelegate,
  canDelegate,
} from "@ledgerhq/live-common/families/cosmos/logic";
import { Text } from "@ledgerhq/native-ui";
import {
  AccountBannerState,
  getAccountBannerState as getCosmosBannerState,
} from "@ledgerhq/live-common/families/cosmos/banner";
import cryptoFactory from "@ledgerhq/coin-cosmos/chain/chain";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { AccountLike } from "@ledgerhq/types-live";
import { StackNavigationProp } from "@react-navigation/stack";
import AccountDelegationInfo from "~/components/AccountDelegationInfo";
import IlluRewards from "~/icons/images/Rewards";
import { urls } from "~/utils/urls";
import AccountSectionLabel from "~/components/AccountSectionLabel";
import DelegationDrawer from "~/components/DelegationDrawer";
import type { IconProps } from "~/components/DelegationDrawer";
import Touchable from "~/components/Touchable";
import { rgba } from "../../../colors";
import { ScreenName, NavigatorName } from "~/const";
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
import AccountBanner from "~/components/AccountBanner";
import { getAccountBannerProps as getCosmosBannerProps } from "../utils";
import ValidatorImage from "../shared/ValidatorImage";
import { useAccountName } from "~/reducers/wallet";
import { useAccountUnit } from "~/hooks/useAccountUnit";
import { useStake } from "LLM/hooks/useStake/useStake";
import { getCurrencyConfiguration } from "@ledgerhq/live-common/config/index";

type Props = {
  account: CosmosAccount;
};

type DelegationDrawerProps = React.ComponentProps<typeof DelegationDrawer>;
type DelegationDrawerActions = DelegationDrawerProps["actions"];

function Delegations({ account }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const mainAccount = getMainAccount(account) as CosmosAccount;
  const delegations: CosmosMappedDelegation[] = useCosmosFamilyMappedDelegations(mainAccount);
  const isCroAccount = account.type === "Account" && account.currency.id === "crypto_org";
  const currency = getAccountCurrency(mainAccount);
  const unit = useAccountUnit(account);
  const navigation = useNavigation();
  const route = useRoute();

  const { validators } = useCosmosFamilyPreloadData(account.currency.id);

  const { cosmosResources } = mainAccount;

  const undelegations =
    cosmosResources &&
    cosmosResources.unbondings &&
    mapUnbondings(cosmosResources.unbondings, validators, unit);
  const bridge = getAccountBridge(account, undefined);
  const { transaction } = useBridgeTransaction(() => {
    const t = bridge.createTransaction(mainAccount);
    const { validatorSrcAddress } = { ...banner };
    return {
      account,
      transaction: bridge.updateTransaction(t, {
        mode: "redelegate",
        validators: [],
        sourceValidator: validatorSrcAddress,
      }),
    };
  });
  const [delegation, setDelegation] = useState<CosmosMappedDelegation>();
  const [undelegation, setUndelegation] = useState<CosmosMappedUnbonding>();
  const { getCanStakeCurrency } = useStake();
  const [banner, setBanner] = useState<AccountBannerState & { description: string; cta: string }>({
    display: false,
    description: "",
    cta: "",
    redelegate: false,
    validatorSrcAddress: "",
    ledgerValidator: undefined,
  });

  const totalRewardsAvailable = delegations.reduce(
    (sum, d) => sum.plus(d.pendingRewards || 0),
    BigNumber(0),
  );

  const onNavigate = useCallback(
    ({
      route,
      screen,
      params,
    }: {
      route: string;
      screen?: string;
      params?: { [key: string]: unknown };
    }) => {
      setDelegation(undefined);
      // This is complicated (even impossible?) to type properly…
      (navigation as StackNavigationProp<{ [key: string]: object }>).navigate(route, {
        screen,
        params: { ...params, accountId: account.id },
      });
    },
    [navigation, account.id],
  );
  const goToStakekit = useCallback(() => {
    onNavigate({
      route: NavigatorName.Base,
      screen: ScreenName.PlatformApp,
      params: {
        platform: "stakekit",
        name: "StakeKit",
        accountId: account.id,
        yieldId: "cronos-cro-native-staking",
      },
    });
  }, [account.id, onNavigate]);

  const onDelegate = useCallback(() => {
    isCroAccount
      ? goToStakekit()
      : onNavigate({
          route: NavigatorName.CosmosDelegationFlow,
          screen:
            delegations.length === 0
              ? ScreenName.CosmosDelegationValidator
              : ScreenName.CosmosDelegationStarted,
          params: {
            source: route,
          },
        });
  }, [onNavigate, delegations, route, goToStakekit, isCroAccount]);

  const onRedelegate = useCallback(() => {
    onNavigate({
      route: NavigatorName.CosmosRedelegationFlow,
      screen: ScreenName.CosmosRedelegationValidator,
      params: {
        source: route,
        validatorName: delegation?.validator?.name,
        accountId: account.id,
        validatorSrcAddress: delegation?.validatorAddress,
      },
    });
  }, [onNavigate, delegation, account, route]);

  useEffect(() => {
    const state = getCosmosBannerState({ ...account });
    const bannerText = getCosmosBannerProps(state, { t }, account);
    setBanner({
      ...state,
      ...bannerText,
      display: state.display && getCanStakeCurrency(currency.id),
    });
  }, [account, t, getCanStakeCurrency, currency.id]);

  const onRedelegateLedger = () => {
    const { validatorSrcAddress, ledgerValidator } = { ...banner };
    const worstValidator = delegations.find(
      delegation => delegation.validatorAddress === validatorSrcAddress,
    );
    onNavigate({
      route: NavigatorName.CosmosRedelegationFlow,
      screen: ScreenName.CosmosDefaultRedelegationAmount,
      params: {
        source: route,
        accountId: account.id,
        validatorSrcAddress,
        transaction: {
          ...transaction,
          sourceValidator: validatorSrcAddress,
        },
        validatorName: ledgerValidator?.name,
        validatorSrc: worstValidator?.validator,
        validator: ledgerValidator,
        max: worstValidator?.amount,
        nextScreen: ScreenName.CosmosRedelegationSelectDevice,
      },
    });
  };

  const onCollectRewards = useCallback(() => {
    isCroAccount
      ? goToStakekit()
      : onNavigate({
          route: NavigatorName.CosmosClaimRewardsFlow,
          screen: delegation
            ? ScreenName.CosmosClaimRewardsMethod
            : ScreenName.CosmosClaimRewardsValidator,
          params: delegation
            ? {
                validator: delegation.validator,
                value: delegation.pendingRewards,
              }
            : {},
        });
  }, [onNavigate, delegation, isCroAccount, goToStakekit]);

  const onUndelegate = useCallback(() => {
    onNavigate({
      route: NavigatorName.CosmosUndelegationFlow,
      screen: ScreenName.CosmosUndelegationAmount,
      params: {
        accountId: account.id,
        delegation,
      },
    });
  }, [onNavigate, delegation, account]);

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
            label: t("cosmos.delegation.drawer.status"),
            Component: (
              <LText
                numberOfLines={1}
                semiBold
                ellipsizeMode="middle"
                style={[styles.valueText]}
                color="live"
              >
                {(d as CosmosMappedDelegation).status === "bonded"
                  ? t("cosmos.delegation.drawer.active")
                  : t("cosmos.delegation.drawer.inactive")}
              </LText>
            ),
          },
          ...(delegation
            ? [
                {
                  label: t("cosmos.delegation.drawer.rewards"),
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
                  label: t("cosmos.delegation.drawer.completionDate"),
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
                  label: t("cosmos.delegation.drawer.redelegatedFrom"),
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
                  label: t("cosmos.delegation.drawer.completionDate"),
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
    const rewardsDisabled =
      !delegation || !delegation.pendingRewards || delegation.pendingRewards.isZero();

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
            skip: isCroAccount,
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
            skip: isCroAccount,
            disabled: !undelegationEnabled,
            onPress: onUndelegate,
            event: "DelegationActionUndelegate",
          },
        ].filter(item => !item.skip)
      : [];
  }, [
    delegation,
    isCroAccount,
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
            isLedger={
              (delegation || undelegation)?.validatorAddress ===
              cryptoFactory(account.currency.id).ledgerValidator
            }
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
              event="Cosmos AccountClaimRewardsBtn Click"
              onPress={onCollectRewards}
              type="primary"
              title={t("account.claimReward.cta")}
            />
          </View>
        </>
      )}
      {banner.display && (
        <View style={styles.banner}>
          <AccountBanner
            {...banner}
            onPress={banner.redelegate ? onRedelegateLedger : onDelegate}
          />
        </View>
      )}
      {delegations.length === 0 ? (
        <AccountDelegationInfo
          title={t("account.delegation.info.title")}
          image={<IlluRewards style={styles.illustration} />}
          description={t("cosmos.delegation.delegationEarn", {
            name: account.currency.name,
            ticker: account.currency.ticker,
          })}
          infoUrl={urls.cosmosStaking}
          infoTitle={t("cosmos.delegation.info")}
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

export default function CosmosDelegations({ account }: { account: AccountLike<CosmosAccount> }) {
  if (account.type !== "Account" || !account.cosmosResources) return null;

  const coinConfig = getCurrencyConfiguration(account.currency);
  if ("disableDelegation" in coinConfig && coinConfig.disableDelegation === true) {
    return null;
  }

  return <Delegations account={account as CosmosAccount} />;
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
