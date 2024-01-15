import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View, Linking } from "react-native";
import { useNavigation, useTheme, ParamListBase, RouteProp } from "@react-navigation/native";
import { differenceInCalendarDays } from "date-fns";
import {
  getDefaultExplorerView,
  getTransactionExplorer,
  getAddressExplorer,
} from "@ledgerhq/live-common/explorers";
import type { AccountLike, Account } from "@ledgerhq/types-live";
import type { Delegation } from "@ledgerhq/live-common/families/tezos/types";
import {
  getMainAccount,
  getAccountCurrency,
  getAccountUnit,
  getAccountName,
} from "@ledgerhq/live-common/account/index";
import { getCurrencyColor } from "@ledgerhq/live-common/currencies/index";
import Icon from "react-native-vector-icons/Feather";
import getWindowDimensions from "~/logic/getWindowDimensions";
import IconReceive from "~/icons/Receive";
import LText from "~/components/LText";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import CounterValue from "~/components/CounterValue";
import CurrencyIcon from "~/components/CurrencyIcon";
import Touchable from "~/components/Touchable";
import QueuedDrawer from "~/components/QueuedDrawer";
import Circle from "~/components/Circle";
import NavigationScrollView from "~/components/NavigationScrollView";
import { rgba } from "../../colors";
import { NavigatorName, ScreenName } from "~/const";
import BakerImage from "./BakerImage";
import DelegatingContainer from "./DelegatingContainer";

type Props = {
  isOpened: boolean;
  onClose: () => void;
  account: AccountLike;
  parentAccount: Account | null | undefined;
  delegation: Delegation;
  parentRoute?: RouteProp<ParamListBase, ScreenName>;
};
const styles = StyleSheet.create({
  modal: {
    position: "relative",
  },
  root: {
    padding: 16,
  },
  subHeader: {
    paddingBottom: 16,
    alignItems: "center",
    alignSelf: "center",
  },
  currencyValue: {
    fontSize: 22,
  },
  counterValue: {
    fontSize: 16,
  },
  propertyRow: {
    borderBottomWidth: 1,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  propertyRowLast: {
    borderBottomWidth: 0,
  },
  propertyLabel: {
    paddingRight: 8,
    fontSize: 14,
  },
  propertyValueText: {
    fontSize: 14,
  },
  propertyBody: {
    width: "50%",
    alignItems: "flex-end",
  },
  footerBtn: {
    width: 80,
    alignItems: "center",
  },
  footerBtnLabel: {
    marginTop: 8,
    fontSize: 14,
    textAlign: "center",
  },
  footer: {
    paddingTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

const Property = ({
  label,
  children,
  last,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  last?: boolean;
}) => {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.propertyRow,
        {
          borderBottomColor: colors.lightFog,
        },
        last ? styles.propertyRowLast : null,
      ]}
    >
      <LText semiBold style={styles.propertyLabel} color="smoke">
        {label}
      </LText>
      <View style={styles.propertyBody}>{children}</View>
    </View>
  );
};

const FooterBtn = ({
  label,
  icon,
  event,
  onPress,
}: {
  label: React.ReactNode;
  icon: React.ReactNode;
  event: string;
  onPress: () => void;
}) => (
  <Touchable event={event} style={styles.footerBtn} onPress={onPress}>
    {icon}
    <LText semiBold style={styles.footerBtnLabel}>
      {label}
    </LText>
  </Touchable>
);

export default function DelegationDetailsModal({
  onClose,
  isOpened,
  account,
  parentAccount,
  delegation,
  parentRoute,
}: Props) {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const currency = getAccountCurrency(account);
  const unit = getAccountUnit(account);
  const mainAccount = getMainAccount(account, parentAccount);
  const { baker } = delegation;
  const amount = account.balance;
  const days = differenceInCalendarDays(Date.now(), delegation.operation.date);
  const color = getCurrencyColor(currency);
  const explorerView = getDefaultExplorerView(mainAccount.currency);
  const bakerURL = getAddressExplorer(explorerView, delegation.address);
  const txURL = getTransactionExplorer(explorerView, delegation.operation.hash);
  const accountId = account.id;
  const parentId = parentAccount?.id;
  const onOpenBaker = useCallback(() => {
    if (bakerURL) Linking.openURL(bakerURL);
  }, [bakerURL]);
  const onOpenTransaction = useCallback(() => {
    if (txURL) Linking.openURL(txURL);
  }, [txURL]);
  const onReceive = useCallback(() => {
    navigation.navigate(NavigatorName.ReceiveFunds, {
      screen: ScreenName.ReceiveConfirmation,
      params: {
        accountId,
        parentId,
      },
    });
    onClose();
  }, [accountId, parentId, navigation, onClose]);
  const onChangeValidator = useCallback(() => {
    // FIXME how to get rid of Started step in nav stack?
    navigation.navigate(NavigatorName.TezosDelegationFlow, {
      screen: ScreenName.DelegationSummary,
      params: {
        accountId,
        parentId,
        source: parentRoute,
      },
    });
    onClose();
  }, [navigation, accountId, parentId, parentRoute, onClose]);
  const onEndDelegation = useCallback(() => {
    // FIXME how to get rid of Started step in nav stack?
    navigation.navigate(NavigatorName.TezosDelegationFlow, {
      screen: ScreenName.DelegationSummary,
      params: {
        accountId,
        parentId,
        mode: "undelegate",
      },
    });
    onClose();
  }, [navigation, accountId, parentId, onClose]);
  const height = Math.min(getWindowDimensions().height - 400, 280);
  return (
    // TODO use DelegationDrawer component
    <QueuedDrawer isRequestingToBeOpened={isOpened} onClose={onClose} style={styles.modal}>
      <View style={styles.root}>
        <DelegatingContainer
          left={
            <Circle size={64} bg={rgba(color, 0.2)}>
              <CurrencyIcon size={32} currency={currency} />
            </Circle>
          }
          right={<BakerImage baker={baker} />}
        />

        <View style={styles.subHeader}>
          <LText semiBold style={styles.currencyValue}>
            <CurrencyUnitValue showCode unit={unit} value={amount} />
          </LText>

          <LText semiBold style={styles.counterValue} color="grey">
            <CounterValue showCode currency={currency} value={amount} />
          </LText>
        </View>

        <NavigationScrollView
          style={{
            height,
          }}
        >
          {baker ? (
            <Property label={<Trans i18nKey="delegation.validator" />}>
              <LText semiBold style={styles.propertyValueText} numberOfLines={1}>
                {baker.name}
              </LText>
            </Property>
          ) : null}
          <Property label={<Trans i18nKey="delegation.validatorAddress" />}>
            <Touchable event="DelegationDetailsOpenBaker" onPress={onOpenBaker}>
              <LText
                semiBold
                style={[styles.propertyValueText]}
                color="live"
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {delegation.address}
              </LText>
            </Touchable>
          </Property>
          <Property label={<Trans i18nKey="delegation.delegatedAccount" />}>
            <LText
              semiBold
              style={styles.propertyValueText}
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {getAccountName(account)}
            </LText>
          </Property>
          <Property label={<Trans i18nKey="delegation.duration" />}>
            <LText semiBold style={styles.propertyValueText}>
              {days ? (
                <Trans
                  i18nKey="delegation.durationDays"
                  count={days}
                  values={{
                    count: days,
                  }}
                />
              ) : (
                <Trans i18nKey="delegation.durationDays0" />
              )}
            </LText>
          </Property>
          <Property last label={<Trans i18nKey="delegation.transactionID" />}>
            <Touchable event="DelegationDetailsOpenTx" onPress={onOpenTransaction}>
              <LText
                semiBold
                style={[styles.propertyValueText]}
                color="live"
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {delegation.operation.hash}
              </LText>
            </Touchable>
          </Property>
        </NavigationScrollView>

        {account.type !== "Account" ? null : (
          <View style={styles.footer}>
            <FooterBtn
              event="DelegationDetailsReceive"
              label={<Trans i18nKey="delegation.receive" />}
              icon={
                <Circle bg={rgba(colors.live, 0.2)} size={48}>
                  <IconReceive size={16} color={colors.live} />
                </Circle>
              }
              onPress={onReceive}
            />
            <FooterBtn
              event="DelegationDetailsChangeValidator"
              label={<Trans i18nKey="delegation.changeValidator" />}
              icon={
                <Circle bg={rgba(colors.live, 0.2)} size={48}>
                  <Icon size={16} name="edit-2" color={colors.live} />
                </Circle>
              }
              onPress={onChangeValidator}
            />
            <FooterBtn
              event="DelegationDetailsUndelegate"
              label={<Trans i18nKey="delegation.endDelegation" />}
              icon={
                <Circle bg={rgba(colors.alert, 0.2)} size={48}>
                  <View
                    style={{
                      borderRadius: 4,
                      backgroundColor: colors.alert,
                      width: 16,
                      height: 16,
                    }}
                  />
                </Circle>
              }
              onPress={onEndDelegation}
            />
          </View>
        )}
      </View>
    </QueuedDrawer>
  );
}
