import React, { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import type { Account } from "@ledgerhq/types-live";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import type { Transaction as OsmosisTransaction } from "@ledgerhq/live-common/families/osmosis/types";
import { ScreenName } from "../../const";
import CosmosFamilySendRowsCustomComponent from "../cosmos/shared/CosmosFamilySendRowsCustomComponent";

type Props = {
  account: Account;
  transaction: Transaction;
};

export default function OsmosisSendRowsCustom(props: Props) {
  const { account } = props;
  const transaction = props.transaction as OsmosisTransaction;
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
