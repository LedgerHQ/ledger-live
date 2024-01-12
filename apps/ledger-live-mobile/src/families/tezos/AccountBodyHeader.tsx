import React, { useCallback, useState } from "react";
import { Trans } from "react-i18next";
import { differenceInCalendarDays } from "date-fns";
import { StyleSheet, Platform, View } from "react-native";
import { AccountLike, Account } from "@ledgerhq/types-live";
import {
  shortAddressPreview,
  getAccountCurrency,
  getAccountUnit,
} from "@ledgerhq/live-common/account/index";
import { useDelegation } from "@ledgerhq/live-common/families/tezos/bakers";
import { Flex, Text } from "@ledgerhq/native-ui";
import LText from "~/components/LText";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import CounterValue from "~/components/CounterValue";
import DelegationDetailsModal from "./DelegationDetailsModal";
import BakerImage from "./BakerImage";
import Button from "~/components/wrappedUi/Button";

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
          width: 0,
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

const OpCounterValue = ({ children }: { children?: React.ReactNode }) => (
  <Text fontWeight={"medium"} numberOfLines={1} color="neutral.c70">
    {children}
  </Text>
);

const placeholderProps = {
  width: 40,
  containerHeight: 20,
};

export default function TezosAccountBodyHeader({
  account,
  parentAccount,
}: {
  account: AccountLike;
  parentAccount?: Account;
}) {
  const [openedModal, setOpenedModal] = useState(false);

  const onModalClose = useCallback(() => {
    setOpenedModal(false);
  }, []);

  const onViewDetails = useCallback(() => {
    setOpenedModal(true);
  }, []);

  const delegation = useDelegation(account);

  if (!delegation) {
    return null;
  }

  const name = delegation.baker ? delegation.baker.name : shortAddressPreview(delegation.address);
  const amount = account.balance;
  const currency = getAccountCurrency(account);
  const unit = getAccountUnit(account);
  const days = differenceInCalendarDays(Date.now(), delegation.operation.date);

  return (
    <View style={styles.root}>
      <Text variant={"h3"} color={"neutral.c100"}>
        <Trans i18nKey="delegation.delegation" />
      </Text>

      <View style={[]}>
        <Flex
          flexDirection={"row"}
          alignItems={"center"}
          py={6}
          style={[
            {
              opacity: delegation.isPending ? 0.5 : 1,
            },
          ]}
        >
          <BakerImage size={40} baker={delegation.baker} />
          <View style={styles.cardHeadBody}>
            <View style={styles.row}>
              <Text variant={"body"} fontWeight={"semiBold"} numberOfLines={1}>
                {name}
              </Text>
              <Text variant={"body"} fontWeight={"semiBold"}>
                <CurrencyUnitValue showCode unit={unit} value={amount} />
              </Text>
            </View>
            <View style={styles.row}>
              <LText style={styles.subtitle} color="grey">
                {days ? (
                  <Trans i18nKey="delegation.durationDays" count={days} values={{ count: days }} />
                ) : (
                  <Trans i18nKey="delegation.durationDays0" />
                )}
              </LText>

              <CounterValue
                showCode
                currency={currency}
                value={amount}
                withPlaceholder
                placeholderProps={placeholderProps}
                Wrapper={OpCounterValue}
              />
            </View>
          </View>
        </Flex>
        <Button
          event="ViewDelegationDetails"
          size={"small"}
          type="shade"
          outline
          onPress={onViewDetails}
          mt={2}
        >
          <Trans i18nKey="delegation.viewDetails" />
        </Button>
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
