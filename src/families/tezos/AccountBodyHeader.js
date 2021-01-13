// @flow
import React, { useCallback, useState } from "react";
import { Trans } from "react-i18next";
import { differenceInCalendarDays } from "date-fns";
import { StyleSheet, Platform, View } from "react-native";
import type { AccountLike, Account } from "@ledgerhq/live-common/lib/types";
import {
  shortAddressPreview,
  getAccountCurrency,
  getAccountUnit,
} from "@ledgerhq/live-common/lib/account";
import { useDelegation } from "@ledgerhq/live-common/lib/families/tezos/bakers";
import { useTheme } from "@react-navigation/native";
import Button from "../../components/Button";
import LText from "../../components/LText";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import CounterValue from "../../components/CounterValue";
import DelegationDetailsModal from "./DelegationDetailsModal";
import BakerImage from "./BakerImage";

const styles = StyleSheet.create({
  root: {
    padding: 16,
    alignItems: "stretch",
  },
  title: {
    fontSize: 16,
  },
  card: {
    marginTop: 16,
    borderRadius: 4,
    ...Platform.select({
      android: {
        elevation: 1,
      },
      ios: {
        shadowOpacity: 0.03,
        shadowRadius: 8,
        shadowOffset: {
          height: 4,
        },
      },
    }),
  },
  cardHead: {
    height: 72,
    padding: 16,

    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  cardHeadBody: {
    flex: 1,
    paddingLeft: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  currencyValue: {
    fontSize: 14,
  },
  counterValue: {
    fontSize: 14,
  },
  delegatorName: {
    fontSize: 14,
  },
  subtitle: {
    fontSize: 14,
  },
});

const OpCounterValue = ({ children }: *) => (
  <LText semiBold numberOfLines={1} style={styles.counterValue} color="grey">
    {children}
  </LText>
);

const placeholderProps = {
  width: 40,
  containerHeight: 20,
};

export default function TezosAccountBodyHeader({
  account,
  parentAccount,
}: {
  account: AccountLike,
  parentAccount: ?Account,
}) {
  const { colors } = useTheme();
  const [openedModal, setOpenedModal] = useState(false);

  const onModalClose = useCallback(() => {
    setOpenedModal(false);
  }, []);

  const onViewDetails = useCallback(() => {
    setOpenedModal(true);
  }, []);

  const delegation = useDelegation(account);

  if (!delegation) return null;

  const name = delegation.baker
    ? delegation.baker.name
    : shortAddressPreview(delegation.address);
  const amount = account.balance;
  const currency = getAccountCurrency(account);
  const unit = getAccountUnit(account);
  const days = differenceInCalendarDays(Date.now(), delegation.operation.date);

  return (
    <View style={styles.root}>
      <LText secondary semiBold style={styles.title}>
        <Trans i18nKey="delegation.delegation" />
      </LText>

      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.white,
            ...Platform.select({
              android: {},
              ios: {
                shadowColor: colors.black,
              },
            }),
          },
        ]}
      >
        <View
          style={[
            styles.cardHead,
            {
              borderBottomColor: colors.lightFog,
              opacity: delegation.isPending ? 0.5 : 1,
            },
          ]}
        >
          <BakerImage size={40} baker={delegation.baker} />
          <View style={styles.cardHeadBody}>
            <View style={styles.row}>
              <LText semiBold style={styles.delegatorName}>
                {name}
              </LText>
              <LText semiBold numberOfLines={1} style={styles.currencyValue}>
                <CurrencyUnitValue showCode unit={unit} value={amount} />
              </LText>
            </View>
            <View style={styles.row}>
              <LText style={styles.subtitle} color="grey">
                {days ? (
                  <Trans
                    i18nKey="delegation.durationDays"
                    count={days}
                    values={{ count: days }}
                  />
                ) : (
                  <Trans i18nKey="delegation.durationDays0" />
                )}
              </LText>

              <CounterValue
                showCode
                date={delegation.operation.date}
                currency={currency}
                value={amount}
                withPlaceholder
                placeholderProps={placeholderProps}
                Wrapper={OpCounterValue}
              />
            </View>
          </View>
        </View>
        <Button
          type="lightSecondary"
          event="ViewDelegationDetails"
          title={<Trans i18nKey="delegation.viewDetails" />}
          onPress={onViewDetails}
          size={13}
        />
      </View>

      <DelegationDetailsModal
        isOpened={openedModal}
        onClose={onModalClose}
        delegation={delegation}
        account={account}
        parentAccount={parentAccount}
      />
    </View>
  );
}
