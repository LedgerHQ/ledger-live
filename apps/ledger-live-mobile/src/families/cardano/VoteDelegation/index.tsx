import React, { useCallback, useState, useMemo } from "react";
import { View, StyleSheet, Linking } from "react-native";
import { useNavigation, useTheme } from "@react-navigation/native";
import { useTranslation } from "~/context/Locale";
import type { CardanoAccount } from "@ledgerhq/live-common/families/cardano/types";
import { getDefaultExplorerView, getDRepExplorer } from "@ledgerhq/live-common/explorers";

import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AccountLike } from "@ledgerhq/types-live";
import VoteDelegationInfo from "./Info";
import AccountSectionLabel from "~/components/AccountSectionLabel";
import VoteDelegationDrawer from "./Drawer";
import type { IconProps } from "~/components/DelegationDrawer";
import Circle from "~/components/Circle";
import LText from "~/components/LText";
import Touchable from "~/components/Touchable";
import IlluRewards from "~/icons/images/Rewards";
import { ScreenName, NavigatorName } from "~/const";
import RedelegateIcon from "~/icons/Redelegate";
import VoteDelegationRow from "./Row";
import DRepImage from "../VoteDelegationFlow/DRepImage";
import { useAccountName } from "~/reducers/wallet";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import CounterValue from "~/components/CounterValue";

type Props = {
  account: CardanoAccount;
};

type DelegationDrawerProps = React.ComponentProps<typeof VoteDelegationDrawer>;
type DelegationDrawerActions = DelegationDrawerProps["actions"];

function VoteDelegation({ account }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const navigation = useNavigation();

  const { cardanoResources } = account;
  const d = cardanoResources.delegation;

  const [dRepHex, setDRepHex] = useState<string>();

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
      setDRepHex(undefined);
      (navigation as NativeStackNavigationProp<{ [key: string]: object }>).navigate(route, {
        screen,
        params: { ...params, accountId: account.id },
      });
    },
    [navigation, account.id],
  );

  const onDelegate = useCallback(() => {
    onNavigate({
      route: NavigatorName.CardanoVoteDelegationFlow,
      screen: ScreenName.CardanoVoteDelegationStarted,
    });
  }, [onNavigate]);

  const onRedelegate = useCallback(() => {
    onNavigate({
      route: NavigatorName.CardanoVoteDelegationFlow,
      screen: ScreenName.CardanoVoteDelegationStarted,
    });
  }, [onNavigate]);

  const onCloseDrawer = useCallback(() => {
    setDRepHex(undefined);
  }, []);

  const onOpenExplorer = useCallback(
    (hex: string) => {
      const explorerView = getDefaultExplorerView(account.currency);
      const srURL = explorerView && getDRepExplorer(explorerView, hex);

      if (srURL) Linking.openURL(srURL);
    },
    [account.currency],
  );

  const accountName = useAccountName(account);
  const unit = useAccountUnit(account);

  const data = useMemo<DelegationDrawerProps["data"]>(() => {
    return dRepHex
      ? [
          {
            label: t("cardano.voteDelegation.drepId"),
            Component: (
              <Touchable onPress={() => onOpenExplorer(dRepHex)} event="VoteDelegationOpenExplorer">
                <LText
                  numberOfLines={1}
                  semiBold
                  ellipsizeMode="middle"
                  style={[styles.valueText]}
                  color="live"
                >
                  {dRepHex === "2"
                    ? t("cardano.voteDelegation.options.alwaysAbstain")
                    : dRepHex === "3"
                    ? t("cardano.voteDelegation.options.alwaysNoConfidence")
                    : dRepHex}
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
        ]
      : [];
  }, [dRepHex, t, accountName, onOpenExplorer]);

  const actions = useMemo<DelegationDrawerActions>(() => {
    return [
      {
        label: t("cardano.voteDelegation.changeVoteDelegation"),
        Icon: (props: IconProps) => (
          <Circle {...props} bg={colors.fog}>
            <RedelegateIcon color={undefined} />
          </Circle>
        ),
        disabled: false,
        onPress: onRedelegate,
        event: "VoteDelegationActionRedelegate",
      },
    ];
  }, [t, onRedelegate, colors.fog]);

  return (
    <View style={styles.root}>
      <VoteDelegationDrawer
        isOpen={data && data.length > 0}
        onClose={onCloseDrawer}
        account={account}
        ValidatorImage={({ size }) => (
          <DRepImage
            name={dRepHex}
            size={size}
          />
        )}
        formattedAmount={
          <CurrencyUnitValue showCode unit={unit} value={account.balance} />
        }
        formattedCounterValue={
          <CounterValue
            currency={account.currency}
            showCode
            value={account.balance}
            alwaysShowSign={false}
            withPlaceholder
          />
        }
        data={data}
        actions={actions}
      />

      {d && d.dRepHex ? (
        <View style={styles.wrapper}>
          <AccountSectionLabel name={t("cardano.voteDelegation.header")} />
          <View key={d.dRepHex} style={[styles.delegationsWrapper]}>
            <VoteDelegationRow
              dRepHex={d.dRepHex}
              onPress={setDRepHex}
              isLast={true}
            />
          </View>
        </View>
      ) : (
        <VoteDelegationInfo
          title={t("cardano.voteDelegation.header")}
          image={<IlluRewards style={styles.illustration} />}
          description={t("cardano.voteDelegation.delegateVotePower")}
          onPress={onDelegate}
          ctaTitle={t("cardano.voteDelegation.button")}
        />
      )}
    </View>
  );
}

export default function CardanoVoteDelegation({ account }: { account: AccountLike }) {
  if (!(account as CardanoAccount).cardanoResources) return null;
  return <VoteDelegation account={account as CardanoAccount} />;
}

const styles = StyleSheet.create({
  root: {
    marginHorizontal: 16,
  },
  illustration: { alignSelf: "center", marginBottom: 16 },
  wrapper: {
    marginBottom: 16,
  },
  delegationsWrapper: {
    borderRadius: 4,
  },
  valueText: {
    fontSize: 14,
  },
});
