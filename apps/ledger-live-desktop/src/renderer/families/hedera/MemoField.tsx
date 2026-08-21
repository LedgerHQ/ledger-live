import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { HEDERA_MAX_MEMO_SIZE } from "@ledgerhq/live-common/families/hedera/constants";
import { HederaGenericTransaction, Transaction } from "@ledgerhq/live-common/families/hedera/types";
import { track } from "~/renderer/analytics/segment";
import { SendAmountProps } from "./types";
import Text from "~/renderer/components/Text";
import MemoTagField from "LLD/features/MemoTag/components/MemoTagField";

const MemoField = ({
  account,
  transaction,
  onChange,
  status,
  trackProperties = {},
  autoFocus,
}: SendAmountProps) => {
  const [memoLength, setMemoLength] = React.useState(0);
  const bridge = useAccountBridge<Transaction>(account);
  // The send flow's own local `Transaction` type is the legacy shape (`memo: string`), but the
  // generic bridge (LIVE-36154) actually produces a `GenericTransaction` at runtime — `memoType`/
  // `memoValue`, not `memo`. Cast at this one boundary rather than re-typing the whole send flow
  // (`SendAmountProps`/`HederaFamily`) the way round 18 does for association; that type says legacy
  // for every field here, not just the memo.
  const genericTransaction = transaction as unknown as HederaGenericTransaction;
  const onMemoChange = useCallback(
    (memo: string) => {
      track("button_clicked2", {
        ...trackProperties,
        button: "input",
        memo,
      });
      onChange(
        bridge.updateTransaction(transaction, {
          memoType: "string",
          memoValue: memo,
        } as Partial<Transaction>),
      );
      setMemoLength(memo.length);
    },
    [trackProperties, onChange, bridge, transaction],
  );

  if (!status) {
    return null;
  }

  return (
    <MemoTagField
      maxLength={HEDERA_MAX_MEMO_SIZE}
      value={genericTransaction.memoValue ?? ""}
      onChange={onMemoChange}
      error={status.errors.transaction}
      CaracterCountComponent={() => (
        <Text fontSize={3}>
          <Trans
            i18nKey="hedera.send.memo.characterCount"
            values={{
              memoLength,
              memoMaxLength: HEDERA_MAX_MEMO_SIZE,
            }}
          />
        </Text>
      )}
      autoFocus={autoFocus}
    />
  );
};
export default MemoField;
