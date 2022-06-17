// @flow

import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";

import type {
  Account,
  AccountLike,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/lib/types";
import type { TFunction } from "react-i18next";

import Box from "~/renderer/components/Box";
import Label from "~/renderer/components/Label";
import Input from "~/renderer/components/Input";
import Text from "~/renderer/components/Text";

type Props = {
  account: AccountLike,
  parentAccount: ?Account,
  transaction: Transaction,
  onChangeTransaction: (*) => void,
  status: TransactionStatus,
  t: TFunction,
};

const MemoField = ({
  account,
  parentAccount,
  transaction,
  onChangeTransaction,
  status,
  t,
}: Props) => {
  if (!status) return null;

  const bridge = getAccountBridge(account, parentAccount);

  const [memoLength, setMemoLength] = React.useState(0);
  const MEMO_MAX_LENGTH = 100;

  const onMemoChange = useCallback(
    (memo: string) => {
      onChangeTransaction(bridge.updateTransaction(transaction, { memo }));
      setMemoLength(memo.length);
    },
    [bridge, transaction, onChangeTransaction],
  );

  return (
    <Box flow={1}>
      <Box horizontal alignItems="center" justifyContent="space-between" style={{ width: "100%" }}>
        <Label>{t("hedera.send.memo.label")}</Label>
        {/* memo character count */}
        <Text fontSize={3}>
          <Trans
            i18nKey="hedera.send.memo.characterCount"
            values={{ memoLength, memoMaxLength: MEMO_MAX_LENGTH }}
          />
        </Text>
      </Box>
      {/* memo input */}
      <Input maxLength={MEMO_MAX_LENGTH} onChange={onMemoChange} />
    </Box>
  );
};

export default MemoField;
