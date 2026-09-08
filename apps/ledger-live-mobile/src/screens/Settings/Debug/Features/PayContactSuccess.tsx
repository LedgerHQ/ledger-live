import React, { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { BigNumber } from "bignumber.js";
import { ContactIdSchema, selectContacts } from "@domain/entity-contact";
import { PaySuccess } from "@features/flow-pay-contact";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import type { Operation } from "@ledgerhq/types-live";
import { ScreenName } from "~/const";
import { useSelector } from "~/context/hooks";
import { accountsSelector } from "~/reducers/accounts";
import SafeAreaView from "~/components/SafeAreaView";

const SAMPLE_RECIPIENT = {
  id: ContactIdSchema.parse("qa-pay-success"),
  name: "Ada",
  isMe: false,
} as const;

function mockPaySuccessOperation(accountId: string, sender: string): Operation {
  return {
    id: `${accountId}-debug-pay-success`,
    hash: "0xdebugpaysuccess",
    type: "OUT",
    value: new BigNumber("10000000"),
    fee: new BigNumber("21000"),
    senders: [sender],
    recipients: ["0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034"],
    blockHeight: 1,
    blockHash: "0xdebugpaysuccessblock",
    accountId,
    date: new Date("2026-01-01"),
    extra: {},
  };
}

export default function DebugPayContactSuccess() {
  const navigation = useNavigation();
  const accounts = useSelector(accountsSelector);
  const account = accounts[0];
  const payContact = useSelector(selectContacts).find(contact => !contact.isMe);
  const recipient = payContact ? { id: payContact.id, name: payContact.name } : SAMPLE_RECIPIENT;

  const mockOperation = useMemo(() => {
    if (!account) return null;
    return account.operations[0] ?? mockPaySuccessOperation(account.id, account.freshAddress);
  }, [account]);

  const onViewTransaction = useCallback(() => {
    if (!account || !mockOperation) return;
    navigation.navigate(ScreenName.OperationDetails, {
      accountId: account.id,
      operation: mockOperation,
    });
  }, [account, mockOperation, navigation]);

  const onClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const styles = useStyleSheet(
    theme => ({
      container: {
        flex: 1,
        backgroundColor: theme.colors.bg.base,
      },
    }),
    [],
  );

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
      <PaySuccess
        recipient={recipient}
        recipientLabel={recipient.name}
        amountFormatted="10 USDC"
        canViewTransaction
        onViewTransaction={onViewTransaction}
        onClose={onClose}
      />
    </SafeAreaView>
  );
}
