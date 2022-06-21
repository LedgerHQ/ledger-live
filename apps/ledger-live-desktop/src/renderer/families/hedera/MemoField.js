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
  const MEMO_MAX_LENGTH = 100;

  /**
   * NOTE: lint doesn't like `React.useState` and `useCallback` being used
   * conditionally (i.e. below the status check condition). Moved up here to fix that.
   */
  const [memoLength, setMemoLength] = React.useState(0);
  const onMemoChange = useCallback(
    (memo: string) => {
      const bridge = getAccountBridge(account, parentAccount);
      onChangeTransaction(bridge.updateTransaction(transaction, { memo }));
      setMemoLength(memo.length);
    },
    [account, parentAccount, transaction, onChangeTransaction],
  );

  if (!status) return null;

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
