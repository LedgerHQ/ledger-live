import React, { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/families/cosmos/types";
import { ScreenName } from "../../const";
import CosmosFamilySendRowsCustomComponent from "./shared/CosmosFamilySendRowsCustomComponent";

type Props = {
  account: Account;
  transaction: Transaction;
};
export default function CosmosSendRowsCustom({ account, transaction }: Props) {
  const navigation = useNavigation();
  const editMemo = useCallback(() => {
    navigation.navigate(ScreenName.CosmosFamilyEditMemo, {
      account,
      transaction,
    });
  }, [navigation, account, transaction]);
  return (
    <CosmosFamilySendRowsCustomComponent
      transaction={transaction}
      editMemo={editMemo}
    />
  );
}
