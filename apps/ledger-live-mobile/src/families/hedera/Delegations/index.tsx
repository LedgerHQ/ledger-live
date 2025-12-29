import React, { useCallback, useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Linking, StyleSheet, View } from "react-native";
import { capitalize } from "lodash/fp";
import { useNavigation, useTheme } from "@react-navigation/native";
import { getAccountCurrency, isTokenAccount } from "@ledgerhq/coin-framework/account/helpers";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getAddressExplorer, getDefaultExplorerView } from "@ledgerhq/live-common/explorers";
import type { HederaAccount, HederaDelegation } from "@ledgerhq/live-common/families/hedera/types";
import { HEDERA_TRANSACTION_MODES } from "@ledgerhq/live-common/families/hedera/constants";
import { useHederaEnrichedDelegation } from "@ledgerhq/live-common/families/hedera/react";
import type { AccountLike, TokenAccount } from "@ledgerhq/types-live";
import { Box, Flex, Text } from "@ledgerhq/native-ui";
import AccountSectionLabel from "~/components/AccountSectionLabel";
import Circle from "~/components/Circle";
import DelegationDrawer, { IconProps } from "~/components/DelegationDrawer";
import Touchable from "~/components/Touchable";
import { NavigatorName, ScreenName } from "~/const";
import DelegationStatusIcon from "~/families/hedera/Delegations/DelegationStatusIcon";
import { DelegationStatusModal } from "~/families/hedera/shared/DelegationStatusModal";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
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

function Delegations({ account, delegatedPosition }: Readonly<Props>) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const accountName = useAccountName(account);
  const enrichedDelegation = useHederaEnrichedDelegation(account, delegatedPosition);
  const unit = useAccountUnit(account);

  const currency = getAccountCurrency(account);
  const formattedClaimableRewards = formatCurrencyUnit(unit, enrichedDelegation.pendingReward, {
    showCode: true,
    disableRounding: true,
  });

  const openStatusModal = useCallback(() => {
    setIsDrawerOpen(false);
    setIsStatusModalOpen(true);
  }, []);

  const onCloseStatusModal = useCallback(() => {
    setIsStatusModalOpen(false);
    setIsDrawerOpen(true);
  }, []);

  const onCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  const onDelegationSelected = useCallback(() => {
    setIsDrawerOpen(true);
  }, []);

  const openValidatorUrl = useCallback(() => {
    const explorer = getDefaultExplorerView(account.currency);
    const addressExplorer = getAddressExplorer(explorer, enrichedDelegation.validator.address);
    const url = !!enrichedDelegation.validator.address && addressExplorer;

    if (url) {
      Linking.openURL(url);
    }
  }, [account.currency, enrichedDelegation.validator.address]);

  const data = useMemo<DelegationDrawerProps["data"]>(() => {
    return [
      {
        label: t("delegation.validator"),
        Component: (
          <Text
            numberOfLines={1}
            fontWeight="semiBold"
            ellipsizeMode="middle"
            style={[styles.valueText]}
            color="live"
          >
            {enrichedDelegation.validator.name}
          </Text>
        ),
      },
      {
        label: t("hedera.delegatedPositions.details.validatorAddress"),
        Component: (
          <Touchable onPress={() => openValidatorUrl()} event="DelegationOpenExplorer">
            <Text
              numberOfLines={1}
              fontWeight="semiBold"
              ellipsizeMode="middle"
              style={styles.valueText}
              color="live"
            >
              {enrichedDelegation.validator.address}
            </Text>
          </Touchable>
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
          <Touchable event="DelegationOpenStatusModal" onPress={openStatusModal}>
            <Flex flexDirection="row" alignItems="center" columnGap={4}>
              <DelegationStatusIcon status={enrichedDelegation.status} color={colors.live} />
              <Text
                numberOfLines={1}
                fontWeight="semiBold"
                ellipsizeMode="middle"
                style={styles.valueText}
                color="live"
              >
                <Trans
                  i18nKey={`hedera.delegatedPositions.details.status.${enrichedDelegation.status}`}
                />
              </Text>
            </Flex>
          </Touchable>
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
  }, [
    openStatusModal,
    enrichedDelegation,
    accountName,
    formattedClaimableRewards,
    colors.live,
    t,
    openValidatorUrl,
  ]);

  const delegationActions = useMemo<DelegationDrawerActions>(() => {
    const allStakeActions = [
      HEDERA_TRANSACTION_MODES.Redelegate,
      HEDERA_TRANSACTION_MODES.ClaimRewards,
      HEDERA_TRANSACTION_MODES.Undelegate,
    ] satisfies HEDERA_TRANSACTION_MODES[];

    const mapStakeActionToDisabled = {
      [HEDERA_TRANSACTION_MODES.Redelegate]: false,
      [HEDERA_TRANSACTION_MODES.ClaimRewards]: enrichedDelegation.pendingReward.isZero(),
      [HEDERA_TRANSACTION_MODES.Undelegate]: false,
    } as const satisfies Record<(typeof allStakeActions)[number], boolean>;

    const mapStakeActionToColor = {
      [HEDERA_TRANSACTION_MODES.Redelegate]: colors.fog,
      [HEDERA_TRANSACTION_MODES.ClaimRewards]: rgba(colors.yellow, 0.2),
      [HEDERA_TRANSACTION_MODES.Undelegate]: rgba(colors.alert, 0.2),
    } as const satisfies Record<(typeof allStakeActions)[number], unknown>;

    const mapStakeActionToNavigationParams = {
      [HEDERA_TRANSACTION_MODES.Redelegate]: [
        NavigatorName.HederaRedelegationFlow,
        {
          screen: ScreenName.HederaRedelegationSelectValidator,
          params: {
            accountId: account.id,
            enrichedDelegation,
          },
        },
      ],
      [HEDERA_TRANSACTION_MODES.ClaimRewards]: [
        NavigatorName.HederaClaimRewardsFlow,
        {
          screen: ScreenName.HederaClaimRewardsSelectReward,
          params: {
            accountId: account.id,
            enrichedDelegation,
          },
        },
      ],
      [HEDERA_TRANSACTION_MODES.Undelegate]: [
        NavigatorName.HederaUndelegationFlow,
        {
          screen: ScreenName.HederaUndelegationAmount,
          params: {
            accountId: account.id,
            enrichedDelegation,
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
  }, [account.id, colors.fog, colors.alert, colors.yellow, navigation, enrichedDelegation, t]);

  return (
    <View style={styles.root}>
      <DelegationDrawer
        isOpen={data && data.length > 0 && isDrawerOpen}
        onClose={onCloseDrawer}
        account={account}
        ValidatorImage={({ size }) => (
          <ValidatorIcon validator={enrichedDelegation.validator} size={size} />
        )}
        amount={enrichedDelegation.delegated}
        data={data}
        actions={delegationActions}
      />
      <DelegationStatusModal
        status={enrichedDelegation.status}
        isOpen={isStatusModalOpen}
        onClose={onCloseStatusModal}
      />
      <View>
        <DelegationRewards account={account} enrichedDelegation={enrichedDelegation} unit={unit} />
        <AccountSectionLabel name={t("account.delegation.sectionLabel")} />
        <Box mt={6}>
          <View style={[styles.delegationsWrapper]}>
            <DelegationRow
              enrichedDelegation={enrichedDelegation}
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

export default function HederaDelegations({ account }: Readonly<{ account: AccountLike }>) {
  const { getCanStakeCurrency } = useStake();

  const hederaAccount = account as HederaAccount | TokenAccount;

  if (isTokenAccount(hederaAccount)) {
    return null;
  }

  if (!getCanStakeCurrency(hederaAccount.currency.id)) {
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
