import { BigNumber } from "bignumber.js";
import React, { useCallback, useState, useMemo } from "react";
import { StackNavigationProp } from "@react-navigation/stack";
import { View, StyleSheet, Linking } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import {
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/live-common/account/index";
import {
  getDefaultExplorerView,
  getAddressExplorer,
} from "@ledgerhq/live-common/explorers";
import { Account } from "@ledgerhq/types-live";
import {
  canDelegate,
  isDefaultValidatorNode,
  getReadableDate,
} from "@ledgerhq/live-common/families/avalanchepchain/utils";
import {
  AvalancheDelegation,
  AvalanchePChainAccount,
} from "@ledgerhq/live-common/families/avalanchepchain/types";
import AccountDelegationInfo from "../../../components/AccountDelegationInfo";
import IlluRewards from "../../../icons/images/Rewards";
import { urls } from "../../../config/urls";
import AccountSectionLabel from "../../../components/AccountSectionLabel";
import DelegationDrawer from "../../../components/DelegationDrawer";
import Touchable from "../../../components/Touchable";
import { ScreenName, NavigatorName } from "../../../const";
import LText from "../../../components/LText";
import DelegationRow from "./Row";
import DelegationLabelRight from "./LabelRight";
import ValidatorImage from "../../cosmos/shared/ValidatorImage";
import Alert from "../../../components/Alert";
import { localeSelector } from "../../../reducers/settings";

type Props = {
  account: Account;
};

type DelegationDrawerProps = React.ComponentProps<typeof DelegationDrawer>;

function Delegations({ account }: Props) {
  const { t } = useTranslation();
  const mainAccount = getMainAccount(account);
  const currency = getAccountCurrency(mainAccount);
  const navigation = useNavigation();
  const locale = useSelector(localeSelector);

  const { avalanchePChainResources } = mainAccount as AvalanchePChainAccount;
  const delegations = useMemo(
    () =>
      (avalanchePChainResources && avalanchePChainResources.delegations) ?? [],
    [avalanchePChainResources],
  );

  const [delegation, setDelegation] = useState<AvalancheDelegation>();

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
      setDelegation();
      (navigation as StackNavigationProp<{ [key: string]: object }>).navigate(
        route,
        {
          screen,
          params: { ...params, accountId: account.id },
        },
      );
    },
    [navigation, account.id],
  );

  const onDelegate = useCallback(() => {
    onNavigate({
      route: NavigatorName.AvalancheDelegationFlow,
      screen:
        delegations.length > 0
          ? ScreenName.AvalancheDelegationValidator
          : ScreenName.AvalancheDelegationStarted,
    });
  }, [onNavigate, delegations]);

  const onCloseDrawer = useCallback(() => {
    setDelegation();
  }, []);

  const onOpenExplorer = useCallback(
    (address: string) => {
      const url = getAddressExplorer(
        getDefaultExplorerView(account.currency),
        address,
      );
      if (url) Linking.openURL(url);
    },
    [account.currency],
  );

  const data = useMemo<DelegationDrawerProps["data"]>(() => {
    const d = delegation;

    return d
      ? [
          {
            label: t("delegation.validator"),
            Component: (
              <Touchable
                onPress={() => onOpenExplorer(d.nodeID)}
                event="DelegationOpenExplorer"
              >
                <LText
                  numberOfLines={1}
                  semiBold
                  ellipsizeMode="middle"
                  style={[styles.valueText]}
                  color="live"
                >
                  {d.nodeID}
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
                {account.name}{" "}
              </LText>
            ),
          },
          {
            label: t("avalanchepchain.delegation.startTime"),
            Component: (
              <LText
                numberOfLines={2}
                semiBold
                ellipsizeMode="middle"
                style={[styles.valueText]}
                color="live"
              >
                {getReadableDate(Number(d.startTime), locale)}
              </LText>
            ),
          },
          {
            label: t("avalanchepchain.delegation.endTime"),
            Component: (
              <LText
                numberOfLines={2}
                semiBold
                ellipsizeMode="tail"
                style={[styles.valueText]}
                color="live"
              >
                {getReadableDate(Number(d.endTime), locale)}
              </LText>
            ),
          },
        ]
      : [];
  }, [delegation, t, account, onOpenExplorer, locale]);

  const delegationDisabled = delegations.length === 0 || !canDelegate(account);

  return (
    <View style={styles.root}>
      {!canDelegate(account) && (
        <Alert
          type="warning"
          learnMoreUrl={urls.avalanche.learnMoreStakingParameters}
          title={t("avalanchepchain.delegation.notEnoughToDelegate")}
        />
      )}
      <DelegationDrawer
        isOpen={data && data.length > 0}
        onClose={onCloseDrawer}
        account={account}
        ValidatorImage={({ size }) => (
          <ValidatorImage
            isLedger={isDefaultValidatorNode(delegation?.nodeID ?? "")}
            name={delegation?.nodeID.split("-")[1] ?? ""}
            size={size}
          />
        )}
        amount={delegation?.stakeAmount ?? new BigNumber(0)}
        data={data}
        actions={[]}
      />
      {delegations.length === 0 ? (
        <AccountDelegationInfo
          title={t("account.delegation.info.title")}
          image={<IlluRewards style={styles.illustration} />}
          description={t("avalanchepchain.delegation.delegationEarn", {
            name: account.currency.name,
          })}
          infoUrl={urls.avalanche.staking}
          infoTitle={t("avalanchepchain.delegation.info")}
          onPress={onDelegate}
          ctaTitle={t("account.delegation.info.cta")}
        />
      ) : (
        <View style={styles.wrapper}>
          <AccountSectionLabel
            name={t("account.delegation.sectionLabel")}
            RightComponent={
              <DelegationLabelRight
                disabled={delegationDisabled}
                onPress={onDelegate}
              />
            }
          />
          {delegations.map((d, i) => (
            <View key={d.txID} style={[styles.delegationsWrapper]}>
              <DelegationRow
                account={account}
                delegation={d}
                currency={currency}
                onPress={() => setDelegation(d)}
                isLast={i === delegations.length - 1}
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function AvalancheDelegations({ account }: Props) {
  if (!(account as AvalanchePChainAccount).avalanchePChainResources)
    return null;
  return <Delegations account={account} />;
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
