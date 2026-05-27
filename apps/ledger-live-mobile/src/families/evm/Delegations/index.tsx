import { BigNumber } from "bignumber.js";
import React, { useCallback, useMemo, useState } from "react";
import { Linking, StyleSheet, View } from "react-native";
import { useNavigation, useRoute, useTheme } from "@react-navigation/native";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { getAddressExplorer, getDefaultExplorerView } from "@ledgerhq/live-common/explorers";
import {
  canDelegate,
  canRedelegate,
  canUndelegate,
  getRedelegation,
  getValidatorExplorerUrl,
  mapDelegations,
  mapUnbondings,
} from "@ledgerhq/live-common/families/evm/staking/logic";
import {
  isStakingAccount,
  StakingAccount,
  StakingMappedDelegation,
  StakingMappedUnbonding,
} from "@ledgerhq/live-common/families/evm/staking/types";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import type { AccountLike } from "@ledgerhq/types-live";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AccountDelegationInfo from "~/components/AccountDelegationInfo";
import AccountSectionLabel from "~/components/AccountSectionLabel";
import Circle from "~/components/Circle";
import DateFromNow from "~/components/DateFromNow";
import DelegationDrawer, { IconProps } from "~/components/DelegationDrawer";
import LText from "~/components/LText";
import Touchable from "~/components/Touchable";
import { NavigatorName, ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import IlluRewards from "~/icons/images/Rewards";
import RedelegateIcon from "~/icons/Redelegate";
import UndelegateIcon from "~/icons/Undelegate";
import { urls } from "~/utils/urls";
import { useAccountName } from "~/reducers/wallet";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import DelegationLabelRight from "./LabelRight";
import DelegationRow from "./Row";
import ValidatorImage from "../shared/ValidatorImage";

type DelegationDrawerProps = React.ComponentProps<typeof DelegationDrawer>;
type DelegationDrawerActions = DelegationDrawerProps["actions"];

function Delegations({ account }: { account: StakingAccount }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const accountName = useAccountName(account);
  const unit = useAccountUnit(account);
  const currency = getAccountCurrency(account);
  const [delegation, setDelegation] = useState<StakingMappedDelegation>();
  const [undelegation, setUndelegation] = useState<StakingMappedUnbonding>();

  const validators = useMemo(
    () => account.stakingResources.validators ?? [],
    [account.stakingResources.validators],
  );
  const delegations = useMemo(
    () => mapDelegations(account.stakingResources.delegations, validators, unit),
    [account.stakingResources.delegations, unit, validators],
  );
  const undelegations = useMemo(
    () => mapUnbondings(account.stakingResources.unbondings, validators, unit),
    [account.stakingResources.unbondings, unit, validators],
  );

  const onNavigate = useCallback(
    ({
      navigator = NavigatorName.EvmDelegationFlow,
      screen,
      params,
    }: {
      navigator?: NavigatorName;
      screen: ScreenName;
      params?: { [key: string]: unknown };
    }) => {
      setDelegation(undefined);
      setUndelegation(undefined);
      (navigation as NativeStackNavigationProp<{ [key: string]: object }>).navigate(
        String(navigator),
        {
          screen,
          params: { ...params, accountId: account.id },
        },
      );
    },
    [account.id, navigation],
  );

  const onDelegate = useCallback(() => {
    onNavigate({
      screen: ScreenName.EvmDelegationValidator,
      params: {
        source: route,
      },
    });
  }, [onNavigate, route]);

  const onRedelegate = useCallback(() => {
    if (!delegation) return;
    onNavigate({
      screen: ScreenName.EvmRedelegationValidator,
      params: {
        source: route,
        validatorName: delegation.validator?.name,
        validatorSrcAddress: delegation.validatorAddress,
      },
    });
  }, [delegation, onNavigate, route]);

  const onUndelegate = useCallback(() => {
    if (!delegation) return;
    onNavigate({
      navigator: NavigatorName.EvmUndelegationFlow,
      screen: ScreenName.EvmUndelegationAmount,
      params: {
        delegation,
      },
    });
  }, [delegation, onNavigate]);

  const onCloseDrawer = useCallback(() => {
    setDelegation(undefined);
    setUndelegation(undefined);
  }, []);

  const onOpenExplorer = useCallback(
    (address: string) => {
      const explorerView = getDefaultExplorerView(account.currency);
      const url =
        getValidatorExplorerUrl(account.currency.id, address) ||
        (explorerView && getAddressExplorer(explorerView, address));
      if (url) Linking.openURL(url);
    },
    [account.currency],
  );

  const data = useMemo<DelegationDrawerProps["data"]>(() => {
    const selected = delegation || undelegation;
    const redelegation = delegation && getRedelegation(account, delegation);
    if (!selected) return [];
    const validatorName = selected.validator?.name ?? selected.validatorAddress;

    return [
      {
        label: t("delegation.validator"),
        Component: (
          <LText numberOfLines={1} semiBold ellipsizeMode="middle" style={styles.valueText}>
            {validatorName}
          </LText>
        ),
      },
      {
        label: t("delegation.validatorAddress"),
        Component: (
          <Touchable
            onPress={() => onOpenExplorer(selected.validatorAddress)}
            event="DelegationOpenExplorer"
          >
            <LText
              numberOfLines={1}
              semiBold
              ellipsizeMode="middle"
              style={styles.valueText}
              color="live"
            >
              {selected.validatorAddress}
            </LText>
          </Touchable>
        ),
      },
      {
        label: t("delegation.delegatedAccount"),
        Component: (
          <LText numberOfLines={1} semiBold ellipsizeMode="middle" style={styles.valueText}>
            {accountName}
          </LText>
        ),
      },
      ...(delegation
        ? [
            {
              label: t("evm.delegation.drawer.status"),
              Component: (
                <LText numberOfLines={1} semiBold ellipsizeMode="middle" style={styles.valueText}>
                  {delegation.status === "bonded"
                    ? t("evm.delegation.drawer.active")
                    : t("evm.delegation.drawer.inactive")}
                </LText>
              ),
            },
            {
              label: t("evm.delegation.drawer.rewards"),
              Component: (
                <LText numberOfLines={1} semiBold style={styles.valueText}>
                  {delegation.formattedPendingRewards}
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
                    style={styles.valueText}
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
    ];
  }, [account, accountName, delegation, onOpenExplorer, t, undelegation]);

  const actions = useMemo<DelegationDrawerActions>(() => {
    if (!delegation) return [];
    const result: DelegationDrawerActions = [];

    if (canUndelegate(account)) {
      result.push({
        label: t("delegation.actions.undelegate"),
        Icon: (props: IconProps) => (
          <Circle {...props} bg={colors.fog}>
            <UndelegateIcon />
          </Circle>
        ),
        onPress: onUndelegate,
        event: "DelegationActionUndelegate",
      });
    }

    if (canRedelegate(account, delegation)) {
      result.push({
        label: t("delegation.actions.redelegate"),
        Icon: (props: IconProps) => (
          <Circle {...props} bg={colors.fog}>
            <RedelegateIcon />
          </Circle>
        ),
        onPress: onRedelegate,
        event: "DelegationActionRedelegate",
      });
    }

    return result;
  }, [account, colors.fog, delegation, onRedelegate, onUndelegate, t]);

  const delegationDisabled = delegations.length <= 0 || !canDelegate(account);
  const selected = delegation || undelegation;

  return (
    <View style={styles.root}>
      <DelegationDrawer
        isOpen={data.length > 0}
        onClose={onCloseDrawer}
        account={account}
        ValidatorImage={({ size }) => (
          <ValidatorImage
            isLedger={false}
            name={
              selected?.validator?.name ?? selected?.validatorAddress ?? account.currency.ticker
            }
            size={size}
          />
        )}
        amount={selected?.amount ?? new BigNumber(0)}
        data={data}
        actions={actions}
      />
      {delegations.length === 0 ? (
        <AccountDelegationInfo
          title={t("account.delegation.info.title")}
          image={<IlluRewards style={styles.illustration} />}
          description={t("evm.delegation.delegationEarn", {
            ticker: account.currency.ticker,
          })}
          infoUrl={urls.discover.earn}
          infoTitle={t("evm.delegation.info")}
          onPress={onDelegate}
          ctaTitle={t("account.delegation.info.cta")}
        />
      ) : (
        <View style={styles.wrapper}>
          <AccountSectionLabel
            name={t("evm.delegation.header")}
            RightComponent={
              <DelegationLabelRight disabled={delegationDisabled} onPress={onDelegate} />
            }
          />
          {delegations.map((d, i) => (
            <View key={d.validatorAddress} style={styles.delegationsWrapper}>
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
      {undelegations.length > 0 ? (
        <View style={styles.wrapper}>
          <AccountSectionLabel name={t("account.undelegation.sectionLabel")} />
          {undelegations.map((d, i) => (
            <View
              key={`${d.validatorAddress}-${d.completionDate.valueOf()}`}
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
      ) : null}
    </View>
  );
}

export default function EvmDelegations({ account }: { account: AccountLike }) {
  const { enabled, params } = useFeature("evmNativeStaking") ?? {};
  const isSupported =
    account.type === "Account" &&
    params?.supportedCurrencyIds?.some(id => id === account.currency.id) === true;

  if (!enabled || !isSupported || account.type !== "Account" || !isStakingAccount(account)) {
    return null;
  }

  return <Delegations account={account} />;
}

const styles = StyleSheet.create({
  root: {
    marginHorizontal: 16,
  },
  illustration: {
    alignSelf: "center",
    marginBottom: 16,
  },
  wrapper: {},
  delegationsWrapper: {
    borderRadius: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  delegationRow: {
    paddingVertical: 16,
  },
  borderBottom: {
    borderBottomWidth: 1,
  },
  icon: {
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    borderRadius: 5,
    marginRight: 12,
  },
  nameWrapper: {
    flex: 1,
    marginRight: 8,
  },
  rightWrapper: {
    alignItems: "flex-end",
  },
  seeMore: {
    fontSize: 14,
  },
  valueText: {
    fontSize: 14,
  },
});
