import {
  getAccountCurrency,
  getAccountUnit,
  getMainAccount,
} from "@ledgerhq/live-common/account/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getAddressExplorer, getDefaultExplorerView } from "@ledgerhq/live-common/explorers";
import { stakeActions, stakeActivePercent } from "@ledgerhq/live-common/families/solana/logic";
import { useSolanaStakesWithMeta } from "@ledgerhq/live-common/families/solana/react";
import {
  SolanaAccount,
  SolanaStakeWithMeta,
  StakeAction,
} from "@ledgerhq/live-common/families/solana/types";
import {
  assertUnreachable,
  sweetch,
  tupleOfUnion,
} from "@ledgerhq/live-common/families/solana/utils";
import { AccountLike } from "@ledgerhq/types-live";
import { Box, Text } from "@ledgerhq/native-ui";
import { useNavigation, useTheme } from "@react-navigation/native";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import { capitalize } from "lodash/fp";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Linking, StyleSheet, View } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { rgba } from "../../../colors";
import AccountDelegationInfo from "~/components/AccountDelegationInfo";
import AccountSectionLabel from "~/components/AccountSectionLabel";
import Circle from "~/components/Circle";
import DelegationDrawer, { IconProps } from "~/components/DelegationDrawer";
import Touchable from "~/components/Touchable";
import { urls } from "~/utils/urls";
import { NavigatorName, ScreenName } from "~/const";
import ClaimRewardIcon from "~/icons/ClaimReward";
import DelegateIcon from "~/icons/Delegate";
import IlluRewards from "~/icons/images/Rewards";
import UndelegateIcon from "~/icons/Undelegate";
import ValidatorImage from "../shared/ValidatorImage";
import DelegationLabelRight from "./LabelRight";
import DelegationRow from "./Row";

type Props = {
  account: SolanaAccount;
};

type DelegationDrawerProps = Parameters<typeof DelegationDrawer>[0];
type DelegationDrawerActions = DelegationDrawerProps["actions"];

function Delegations({ account }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const mainAccount = getMainAccount(account, undefined) as SolanaAccount;
  const currency = getAccountCurrency(mainAccount);

  invariant(currency.type === "CryptoCurrency", "expected crypto currency");

  const stakesWithMeta: SolanaStakeWithMeta[] = useSolanaStakesWithMeta(
    currency,
    mainAccount.solanaResources?.stakes ?? [],
  );

  const unit = getAccountUnit(mainAccount);
  const navigation = useNavigation();

  const [selectedStakeWithMeta, setSelectedStakeWithMeta] = useState<
    SolanaStakeWithMeta | undefined
  >();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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
      setSelectedStakeWithMeta(undefined);
      (navigation as StackNavigationProp<{ [key: string]: object | undefined }>).navigate(route, {
        screen,
        params: { ...params, accountId: account.id },
      });
    },
    [account.id, navigation],
  );

  const onCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  const openValidatorUrl = useCallback(
    ({ stake, meta }: SolanaStakeWithMeta) => {
      const { delegation } = stake;
      const url =
        meta.validator?.url ??
        (delegation?.voteAccAddr &&
          getAddressExplorer(getDefaultExplorerView(account.currency), delegation.voteAccAddr));
      if (url) {
        Linking.openURL(url);
      }
    },
    [account.currency],
  );

  const formatAmount = useCallback(
    (amount: number) =>
      formatCurrencyUnit(unit, new BigNumber(amount), {
        disableRounding: true,
        alwaysShowSign: false,
        showCode: true,
      }),
    [unit],
  );

  const data = useMemo<DelegationDrawerProps["data"]>(() => {
    if (selectedStakeWithMeta === undefined) {
      return [];
    }

    const { stake, meta } = selectedStakeWithMeta;

    return [
      {
        label: t("delegation.validator"),
        Component: (
          <Touchable
            onPress={() => openValidatorUrl(selectedStakeWithMeta)}
            event="DelegationOpenExplorer"
          >
            <Text
              numberOfLines={1}
              fontWeight="semiBold"
              ellipsizeMode="middle"
              style={[styles.valueText]}
              color="live"
            >
              {meta.validator?.name ?? stake.delegation?.voteAccAddr ?? "N/A"}
            </Text>
          </Touchable>
        ),
      },
      {
        label: t("solana.delegation.stakeActivationState"),
        Component: (
          <Text
            numberOfLines={1}
            fontWeight="semiBold"
            ellipsizeMode="middle"
            style={[styles.valueText]}
            color="live"
          >
            {t(`solana.delegation.states.${stake.activation.state}`)}
          </Text>
        ),
      },
      {
        label: t("solana.delegation.stakeActivePercent"),
        Component: (
          <Text
            numberOfLines={1}
            fontWeight="semiBold"
            ellipsizeMode="middle"
            style={[styles.valueText]}
            color="live"
          >
            {stake.delegation === undefined ? 0 : stakeActivePercent(stake).toFixed(2)} %
          </Text>
        ),
      },
      {
        label: t("solana.delegation.stakeAvailableBalance"),
        Component: (
          <Text
            numberOfLines={1}
            fontWeight="semiBold"
            ellipsizeMode="middle"
            style={[styles.valueText]}
            color="live"
          >
            {formatAmount(stake.withdrawable)}
          </Text>
        ),
      },
    ];
  }, [selectedStakeWithMeta, t, formatAmount, openValidatorUrl]);

  const delegationActions = useMemo<DelegationDrawerActions>(() => {
    const allStakeActions = tupleOfUnion<StakeAction>()([
      "activate",
      "deactivate",
      "reactivate",
      "withdraw",
    ]);

    const availableActions =
      (selectedStakeWithMeta && stakeActions(selectedStakeWithMeta.stake)) ?? [];

    return allStakeActions.map(action => {
      const actionEnabled = availableActions.includes(action);
      const enabledActionCircleBgColor = sweetch(action, {
        activate: colors.fog,
        deactivate: rgba(colors.alert, 0.2),
        reactivate: colors.fog,
        withdraw: rgba(colors.yellow, 0.2),
      });
      const drawerAction: DelegationDrawerActions[number] = {
        label: t(`solana.delegation.actions.${action}`),
        Icon: (props: IconProps) => (
          <Circle {...props} bg={actionEnabled ? enabledActionCircleBgColor : colors.lightFog}>
            <DrawerStakeActionIcon stakeAction={action} enabled={actionEnabled} />
          </Circle>
        ),
        event: `DelegationAction${capitalize(action)}`,
        onPress: () => {
          onNavigate({
            route: NavigatorName.SolanaDelegationFlow,
            screen: ScreenName.DelegationSummary,
            params: {
              delegationAction: {
                kind: "change",
                stakeWithMeta: selectedStakeWithMeta,
                stakeAction: action,
              },
            },
          });
        },
        disabled: !availableActions.includes(action),
      };
      return drawerAction;
    });
  }, [
    selectedStakeWithMeta,
    colors.fog,
    colors.alert,
    colors.yellow,
    colors.lightFog,
    onNavigate,
    t,
  ]);

  const onDelegate = () => {
    onNavigate({
      route: NavigatorName.SolanaDelegationFlow,
      screen: ScreenName.DelegationSummary,
      params: {
        delegationAction: {
          kind: "new",
        },
      },
    });
  };

  const onDelegationSelected = (stakeWithMeta: SolanaStakeWithMeta) => {
    setIsDrawerOpen(true);
    setSelectedStakeWithMeta(stakeWithMeta);
  };

  return (
    <View style={styles.root}>
      <DelegationDrawer
        isOpen={data && data.length > 0 && isDrawerOpen}
        onClose={onCloseDrawer}
        account={account}
        ValidatorImage={({ size }) => (
          <ValidatorImage
            imgUrl={selectedStakeWithMeta?.meta?.validator?.img}
            name={
              selectedStakeWithMeta?.meta?.validator?.name ??
              selectedStakeWithMeta?.stake.delegation?.voteAccAddr
            }
            size={size}
          />
        )}
        amount={new BigNumber(selectedStakeWithMeta?.stake?.delegation?.stake ?? 0)}
        data={data}
        actions={delegationActions}
      />

      {stakesWithMeta.length === 0 ? (
        <AccountDelegationInfo
          title={t("account.delegation.info.title")}
          image={<IlluRewards style={styles.illustration} />}
          description={t("solana.delegation.delegationEarn", {
            name: account.currency.name,
          })}
          infoUrl={urls.solana.stakingPage}
          infoTitle={t("solana.delegation.info")}
          onPress={onDelegate}
          ctaTitle={t("account.delegation.info.cta")}
        />
      ) : (
        <View style={styles.wrapper}>
          <AccountSectionLabel
            name={t("account.delegation.sectionLabel")}
            RightComponent={<DelegationLabelRight disabled={false} onPress={onDelegate} />}
          />
          <Box mt={6}>
            {stakesWithMeta.map((stakeWithMeta, i) => (
              <View
                key={stakeWithMeta.stake.stakeAccAddr}
                style={[styles.delegationsWrapper, { backgroundColor: colors.card }]}
              >
                <DelegationRow
                  stakeWithMeta={stakeWithMeta}
                  currency={currency}
                  unit={unit}
                  onPress={onDelegationSelected}
                  isLast={i === stakesWithMeta.length - 1}
                />
              </View>
            ))}
          </Box>
        </View>
      )}
    </View>
  );
}

function DrawerStakeActionIcon({
  enabled,
  stakeAction,
}: {
  enabled: boolean;
  stakeAction: StakeAction;
}) {
  const { colors } = useTheme();
  const iconColor = enabled ? undefined : colors.grey;
  switch (stakeAction) {
    case "activate":
    case "reactivate":
      return <DelegateIcon color={iconColor} />;
    case "deactivate":
      return <UndelegateIcon color={iconColor} />;
    case "withdraw":
      return <ClaimRewardIcon color={iconColor} />;
    default:
      return assertUnreachable(stakeAction);
  }
}

export default function SolanaDelegations({ account }: { account: AccountLike }) {
  if (!(account as SolanaAccount).solanaResources) return null;
  return <Delegations account={account as SolanaAccount} />;
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
    padding: 16,
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
});
