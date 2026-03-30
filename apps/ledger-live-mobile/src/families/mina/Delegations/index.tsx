import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/live-common/account/index";
import { MinaAccount } from "@ledgerhq/live-common/families/mina/types";
import { AccountLike } from "@ledgerhq/types-live";
import { Box, Text } from "@ledgerhq/native-ui";
import { useNavigation, useTheme } from "@react-navigation/native";
import { BigNumber } from "bignumber.js";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "~/context/Locale";
import { StyleSheet, View } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AccountDelegationInfo from "~/components/AccountDelegationInfo";
import AccountSectionLabel from "~/components/AccountSectionLabel";
import Circle from "~/components/Circle";
import DelegationDrawer, { IconProps } from "~/components/DelegationDrawer";
import { NavigatorName, ScreenName } from "~/const";
import DelegateIcon from "~/icons/Delegate";
import IlluRewards from "~/icons/images/Rewards";
import UndelegateIcon from "~/icons/Undelegate";
import DelegationRow from "./Row";
import { ValidatorImage } from "../StakingFlow/ValidatorRow";
import { rgba } from "../../../colors";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";

type Props = {
  account: MinaAccount;
};

type DelegationDrawerProps = Parameters<typeof DelegationDrawer>[0];
type DelegationDrawerActions = DelegationDrawerProps["actions"];

function Delegations({ account }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const currency = getAccountCurrency(account);
  const unit = useAccountUnit(account);
  const navigation = useNavigation();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { delegateInfo } = account.resources ?? {};
  const validatorName = delegateInfo?.identityName || delegateInfo?.address || "";

  const onCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  const onOpenDrawer = useCallback(() => {
    setIsDrawerOpen(true);
  }, []);

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
      setIsDrawerOpen(false);
      (navigation as NativeStackNavigationProp<{ [key: string]: object | undefined }>).navigate(
        route,
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
      route: NavigatorName.MinaStakingFlow,
      screen: ScreenName.MinaStakingValidator,
    });
  }, [onNavigate]);

  const onRedelegate = useCallback(() => {
    onNavigate({
      route: NavigatorName.MinaStakingFlow,
      screen: ScreenName.MinaStakingValidator,
    });
  }, [onNavigate]);

  const onUndelegate = useCallback(() => {
    const bridge = getAccountBridge(account);
    const tx = bridge.createTransaction(account);
    const transaction = bridge.updateTransaction(tx, {
      txType: "unstake",
      recipient: account.freshAddress,
    });
    onNavigate({
      route: NavigatorName.MinaStakingFlow,
      screen: ScreenName.MinaStakingSelectDevice,
      params: {
        transaction,
      },
    });
  }, [account, onNavigate]);

  const data = useMemo<DelegationDrawerProps["data"]>(() => {
    if (!delegateInfo) return [];
    return [
      {
        label: t("delegation.validator"),
        Component: (
          <Text
            numberOfLines={1}
            fontWeight="semiBold"
            ellipsizeMode="middle"
            style={styles.valueText}
            color="live"
          >
            {validatorName || "-"}
          </Text>
        ),
      },
      ...(delegateInfo.address
        ? [
            {
              label: t("mina.summaryFooter.producerAddress"),
              Component: (
                <Text
                  numberOfLines={1}
                  fontWeight="semiBold"
                  ellipsizeMode="middle"
                  style={styles.valueText}
                  color="live"
                >
                  {delegateInfo.address}
                </Text>
              ),
            },
          ]
        : []),
    ];
  }, [delegateInfo, t, validatorName]);

  const delegationActions = useMemo<DelegationDrawerActions>(
    () => [
      {
        label: t("mina.delegation.redelegate"),
        Icon: (props: IconProps) => (
          <Circle {...props} bg={colors.fog}>
            <DelegateIcon />
          </Circle>
        ),
        event: "DelegationActionRedelegate",
        onPress: onRedelegate,
        disabled: false,
      },
      {
        label: t("mina.delegation.undelegate"),
        Icon: (props: IconProps) => (
          <Circle {...props} bg={rgba(colors.alert, 0.2)}>
            <UndelegateIcon />
          </Circle>
        ),
        event: "DelegationActionUndelegate",
        onPress: onUndelegate,
        disabled: false,
      },
    ],
    [t, colors.fog, colors.alert, onRedelegate, onUndelegate],
  );

  const hasDelegation = account.resources?.stakingActive;

  return (
    <View style={styles.root}>
      <DelegationDrawer
        isOpen={data.length > 0 && isDrawerOpen}
        onClose={onCloseDrawer}
        account={account}
        ValidatorImage={({ size }) => <ValidatorImage name={validatorName} size={size} />}
        amount={new BigNumber(account.balance)}
        data={data}
        actions={delegationActions}
      />

      {!hasDelegation ? (
        <AccountDelegationInfo
          title={t("account.delegation.info.title")}
          image={<IlluRewards style={styles.illustration} />}
          description={t("mina.stakeBanner.description")}
          infoUrl={"https://minaprotocol.com/blog/mina-token-holders-everything-you-need-to-know-about-staking"}
          infoTitle={t("account.delegation.info.title")}
          onPress={onDelegate}
          ctaTitle={t("account.delegation.info.cta")}
        />
      ) : (
        <View style={styles.wrapper}>
          <AccountSectionLabel name={t("mina.delegation.listHeader")} />
          <Box mt={6}>
            <View style={{ backgroundColor: colors.card, borderRadius: 4 }}>
              <DelegationRow
                account={account}
                currency={currency}
                unit={unit}
                onPress={onOpenDrawer}
              />
            </View>
          </Box>
        </View>
      )}
    </View>
  );
}

export default function MinaDelegations({ account }: { account: AccountLike }) {
  const mainAccount = getMainAccount(account, undefined) as MinaAccount;
  if (!mainAccount.resources) return null;
  return <Delegations account={mainAccount} />;
}

const styles = StyleSheet.create({
  root: {
    marginHorizontal: 16,
  },
  illustration: { alignSelf: "center", marginBottom: 16 },
  wrapper: {},
  valueText: {
    fontSize: 14,
  },
});
