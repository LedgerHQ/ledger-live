import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { HEDERA_MAX_MEMO_SIZE } from "@ledgerhq/live-common/families/hedera/constants";
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
  const bridge = getAccountBridge(account);
  const onMemoChange = useCallback(
    (memo: string) => {
      track("button_clicked2", {
        ...trackProperties,
        button: "input",
        memo,
      });
      onChange(
        bridge.updateTransaction(transaction, {
          memo,
        }),
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
      value={transaction.memo ?? ""}
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
