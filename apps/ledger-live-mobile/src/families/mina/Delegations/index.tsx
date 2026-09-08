import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/live-common/account/index";
import { MinaAccount, Transaction } from "@ledgerhq/live-common/families/mina/types";
import { AccountLike } from "@ledgerhq/types-live";
import { Box, Text } from "@ledgerhq/native-ui";
import { useNavigation, useTheme } from "@react-navigation/native";
import { BigNumber } from "bignumber.js";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "~/context/Locale";
import { urls } from "~/utils/urls";
import { StyleSheet, View } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AccountDelegationInfo from "~/components/AccountDelegationInfo";
import AccountSectionLabel from "~/components/AccountSectionLabel";
import Circle from "~/components/Circle";
import DelegationDrawer, { IconProps } from "~/components/DelegationDrawer";
import GenericErrorBottomModal from "~/components/GenericErrorBottomModal";
import { NavigatorName, ScreenName } from "~/const";
import DelegateIcon from "~/icons/Delegate";
import IlluRewards from "~/icons/images/Rewards";
import UndelegateIcon from "~/icons/Undelegate";
import DelegationRow from "./Row";
import { ValidatorImage } from "../StakingFlow/ValidatorRow";
import { rgba } from "../../../colors";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";

type Props = Readonly<{
  account: MinaAccount;
}>;

type DelegationDrawerProps = Parameters<typeof DelegationDrawer>[0];
type DelegationDrawerActions = DelegationDrawerProps["actions"];

function RedelegateActionIcon(props: Readonly<IconProps>) {
  const { colors } = useTheme();
  return (
    <Circle {...props} bg={colors.fog}>
      <DelegateIcon />
    </Circle>
  );
}

function UndelegateActionIcon(props: Readonly<IconProps>) {
  const { colors } = useTheme();
  return (
    <Circle {...props} bg={rgba(colors.alert, 0.2)}>
      <UndelegateIcon />
    </Circle>
  );
}

const drawerValidatorImage = (name: string) =>
  function DrawerValidatorImage({ size }: Readonly<{ size: number }>) {
    return <ValidatorImage name={name} size={size} />;
  };

function Delegations({ account }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const currency = getAccountCurrency(account);
  const unit = useAccountUnit(account);
  const navigation = useNavigation();
  const bridge = useAccountBridge<Transaction>(account, undefined);
  const stakingUrl = useLocalizedUrl(urls.minaStaking);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPreparingUndelegate, setIsPreparingUndelegate] = useState(false);
  const [undelegateError, setUndelegateError] = useState<Error | null>(null);

  const { delegateInfo } = account.resources ?? {};
  const validatorName = delegateInfo?.identityName || delegateInfo?.address || "-";

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

  const onUndelegate = useCallback(async () => {
    setIsPreparingUndelegate(true);
    try {
      const tx = bridge.createTransaction(account);
      // Unstaking has no summary step, so nothing else on the way to the device fills the fee
      // and the nonce, and the signer rejects a zero fee before the device is even reached.
      const transaction = await bridge.prepareTransaction(
        account,
        bridge.updateTransaction(tx, {
          txType: "unstake",
          recipient: account.freshAddress,
        }),
      );
      const status = await bridge.getTransactionStatus(account, transaction);
      onNavigate({
        route: NavigatorName.MinaStakingFlow,
        screen: ScreenName.MinaStakingSelectDevice,
        params: {
          transaction,
          status,
        },
      });
    } catch (e) {
      setIsDrawerOpen(false);
      setUndelegateError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setIsPreparingUndelegate(false);
    }
  }, [account, bridge, onNavigate]);

  const onCloseUndelegateError = useCallback(() => {
    setUndelegateError(null);
  }, []);

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
            {validatorName}
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
        Icon: RedelegateActionIcon,
        event: "DelegationActionRedelegate",
        onPress: onRedelegate,
        disabled: isPreparingUndelegate,
      },
      {
        label: t("mina.delegation.undelegate"),
        Icon: UndelegateActionIcon,
        event: "DelegationActionUndelegate",
        onPress: onUndelegate,
        disabled: isPreparingUndelegate,
      },
    ],
    [t, onRedelegate, onUndelegate, isPreparingUndelegate],
  );

  const ValidatorImageComponent = useMemo(
    () => drawerValidatorImage(validatorName),
    [validatorName],
  );

  const hasDelegation = account.resources?.stakingActive;

  return (
    <View style={styles.root}>
      <DelegationDrawer
        isOpen={isDrawerOpen}
        onClose={onCloseDrawer}
        account={account}
        ValidatorImage={ValidatorImageComponent}
        amount={new BigNumber(account.balance)}
        data={data}
        actions={delegationActions}
      />

      <GenericErrorBottomModal error={undelegateError} onClose={onCloseUndelegateError} />

      {!hasDelegation ? (
        <AccountDelegationInfo
          title={t("account.delegation.info.title")}
          image={<IlluRewards style={styles.illustration} />}
          description={t("mina.stakeBanner.description")}
          infoUrl={stakingUrl}
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

export default function MinaDelegations({ account }: Readonly<{ account: AccountLike }>) {
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
