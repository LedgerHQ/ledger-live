import React, { useCallback, useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Linking, StyleSheet, View } from "react-native";
import { capitalize } from "lodash/fp";
import { useNavigation, useTheme } from "@react-navigation/native";
import { getAccountCurrency } from "@ledgerhq/coin-framework/account/helpers";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getAddressExplorer, getDefaultExplorerView } from "@ledgerhq/live-common/explorers";
import type {
  HederaAccount,
  HederaDelegation,
  StakingAction,
} from "@ledgerhq/live-common/families/hedera/types";
import { getDelegationStatus } from "@ledgerhq/live-common/families/hedera/logic";
import { useHederaDelegationWithMeta } from "@ledgerhq/live-common/families/hedera/react";
import { AccountLike } from "@ledgerhq/types-live";
import { Box, Flex, Text } from "@ledgerhq/native-ui";
import AccountSectionLabel from "~/components/AccountSectionLabel";
import Circle from "~/components/Circle";
import DelegationDrawer, { IconProps } from "~/components/DelegationDrawer";
import Touchable from "~/components/Touchable";
import { NavigatorName, ScreenName } from "~/const";
import { useAccountUnit } from "~/hooks/useAccountUnit";
import { useAccountName } from "~/reducers/wallet";
import { useStake } from "LLM/hooks/useStake/useStake";
import { rgba } from "../../../colors";
import ValidatorIcon from "../shared/ValidatorIcon";
import DelegationPlaceholder from "./DelegationPlaceholder";
import DelegationRewards from "./DelegationRewards";
import DrawerStakeActionIcon from "./DrawerStakeActionIcon";
import DelegationRow from "./Row";

type Props = {
  account: HederaAccount;
  delegatedPosition: HederaDelegation;
};

type DelegationDrawerProps = Parameters<typeof DelegationDrawer>[0];
type DelegationDrawerActions = DelegationDrawerProps["actions"];

function Delegations({ account, delegatedPosition }: Props) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const accountName = useAccountName(account);
  const delegationWithMeta = useHederaDelegationWithMeta(account, delegatedPosition);
  const unit = useAccountUnit(account);

  const currency = getAccountCurrency(account);
  const formattedClaimableRewards = formatCurrencyUnit(unit, delegationWithMeta.pendingReward, {
    showCode: true,
    disableRounding: true,
  });

  const onCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  const onDelegationSelected = useCallback(() => {
    setIsDrawerOpen(true);
  }, []);

  const openValidatorUrl = useCallback(() => {
    const explorer = getDefaultExplorerView(account.currency);
    const addressExplorer = getAddressExplorer(explorer, delegationWithMeta.validator.address);
    const url = !!delegationWithMeta.validator.address && addressExplorer;

    if (url) {
      Linking.openURL(url);
    }
  }, [account.currency, delegationWithMeta.validator.address]);

  const data = useMemo<DelegationDrawerProps["data"]>(() => {
    const status = getDelegationStatus(delegationWithMeta.validator);

    return [
      {
        label: t("delegation.validator"),
        Component: (
          <Touchable onPress={() => openValidatorUrl()} event="DelegationOpenExplorer">
            <Text
              numberOfLines={1}
              fontWeight="semiBold"
              ellipsizeMode="middle"
              style={[styles.valueText]}
              color="live"
            >
              {delegationWithMeta.validator.name}
            </Text>
          </Touchable>
        ),
      },
      {
        label: t("hedera.delegatedPositions.details.validatorAddress"),
        Component: (
          <Text
            numberOfLines={1}
            fontWeight="semiBold"
            ellipsizeMode="middle"
            style={styles.valueText}
            color="live"
          >
            {delegationWithMeta.validator.address}
          </Text>
        ),
      },
      {
        label: t("hedera.delegatedPositions.details.delegatedAccount"),
        Component: (
          <Text
            numberOfLines={1}
            fontWeight="semiBold"
            ellipsizeMode="middle"
            style={styles.valueText}
            color="live"
          >
            {accountName}
          </Text>
        ),
      },
      {
        label: t("hedera.delegatedPositions.details.status.title"),
        Component: (
          <Flex flexDirection="row" alignItems="center" columnGap={4}>
            <Text
              numberOfLines={1}
              fontWeight="semiBold"
              ellipsizeMode="middle"
              style={styles.valueText}
              color="live"
            >
              <Trans i18nKey={`hedera.delegatedPositions.details.status.${status}`} />
            </Text>
          </Flex>
        ),
      },
      {
        label: t("hedera.delegatedPositions.details.rewards"),
        Component: (
          <Text
            numberOfLines={1}
            fontWeight="semiBold"
            ellipsizeMode="middle"
            style={styles.valueText}
          >
            {formattedClaimableRewards}
          </Text>
        ),
      },
    ];
  }, [delegationWithMeta, accountName, formattedClaimableRewards, t, openValidatorUrl]);

  const delegationActions = useMemo<DelegationDrawerActions>(() => {
    const allStakeActions = [
      "redelegation",
      "claimRewards",
      "undelegation",
    ] satisfies StakingAction[];

    const mapStakeActionToDisabled = {
      redelegation: false,
      claimRewards: delegationWithMeta.pendingReward.isZero(),
      undelegation: false,
    } as const satisfies Record<(typeof allStakeActions)[number], boolean>;

    const mapStakeActionToColor = {
      redelegation: colors.fog,
      claimRewards: rgba(colors.yellow, 0.2),
      undelegation: rgba(colors.alert, 0.2),
    } as const satisfies Record<(typeof allStakeActions)[number], unknown>;

    const mapStakeActionToNavigationParams = {
      redelegation: [
        NavigatorName.HederaRedelegationFlow,
        {
          screen: ScreenName.HederaRedelegationSelectValidator,
          params: {
            accountId: account.id,
            delegationWithMeta,
          },
        },
      ],
      claimRewards: [
        NavigatorName.HederaClaimRewardsFlow,
        {
          screen: ScreenName.HederaClaimRewardsSelectReward,
          params: {
            accountId: account.id,
            delegationWithMeta,
          },
        },
      ],
      undelegation: [
        NavigatorName.HederaUndelegationFlow,
        {
          screen: ScreenName.HederaUndelegationAmount,
          params: {
            accountId: account.id,
            delegationWithMeta,
          },
        },
      ],
    } as const satisfies Record<(typeof allStakeActions)[number], unknown>;

    return allStakeActions.map(action => {
      const enabledActionCircleBgColor = mapStakeActionToColor[action];
      const actionNavigationParams = mapStakeActionToNavigationParams[action];
      const disabled = mapStakeActionToDisabled[action];

      const drawerAction: DelegationDrawerActions[number] = {
        label: t(`hedera.delegatedPositions.details.actions.${action}`),
        event: `DelegationAction${capitalize(action)}`,
        disabled,
        Icon: (props: IconProps) => (
          <Circle {...props} bg={enabledActionCircleBgColor}>
            <DrawerStakeActionIcon action={action} enabled />
          </Circle>
        ),
        onPress: () => {
          navigation.navigate(...actionNavigationParams);
        },
      };

      return drawerAction;
    });
  }, [account.id, colors.fog, colors.alert, colors.yellow, navigation, delegationWithMeta, t]);

  return (
    <View style={styles.root}>
      <DelegationDrawer
        isOpen={data && data.length > 0 && isDrawerOpen}
        onClose={onCloseDrawer}
        account={account}
        ValidatorImage={({ size }) => (
          <ValidatorIcon validator={delegationWithMeta.validator} size={size} />
        )}
        amount={delegationWithMeta.delegated}
        data={data}
        actions={delegationActions}
      />
      <View>
        <DelegationRewards account={account} delegationWithMeta={delegationWithMeta} unit={unit} />
        <AccountSectionLabel name={t("account.delegation.sectionLabel")} />
        <Box mt={6}>
          <View style={[styles.delegationsWrapper]}>
            <DelegationRow
              delegationWithMeta={delegationWithMeta}
              currency={currency}
              unit={unit}
              onPress={onDelegationSelected}
              isLast
            />
          </View>
        </Box>
      </View>
    </View>
  );
}

export default function HederaDelegations({ account }: { account: AccountLike }) {
  const { getCanStakeCurrency } = useStake();

  const hederaAccount = account as HederaAccount;
  const isStakingEnabled = getCanStakeCurrency(hederaAccount.currency.id);

  if (!isStakingEnabled) {
    return null;
  }

  if (!hederaAccount.hederaResources) {
    return null;
  }

  if (!hederaAccount?.hederaResources.delegation) {
    return <DelegationPlaceholder account={hederaAccount} />;
  }

  return (
    <Delegations
      account={hederaAccount}
      delegatedPosition={hederaAccount.hederaResources.delegation}
    />
  );
}

const styles = StyleSheet.create({
  root: {
    marginHorizontal: 16,
  },
  label: {
    fontSize: 20,
    flex: 1,
  },
  column: {
    flexDirection: "column",
  },
  delegationsWrapper: {
    borderRadius: 4,
  },
  valueText: {
    fontSize: 14,
  },
});
