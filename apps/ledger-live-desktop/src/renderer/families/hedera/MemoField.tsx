import React, { useCallback } from "react";
import { Trans, useTranslation } from "react-i18next";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { track } from "~/renderer/analytics/segment";
import { SendAmountProps } from "./types";
import Box from "~/renderer/components/Box";
import Label from "~/renderer/components/Label";
import Input from "~/renderer/components/Input";
import Text from "~/renderer/components/Text";
const MemoField = ({
  account,
  transaction,
  onChange,
  status,
  trackProperties = {},
}: SendAmountProps) => {
  const { t } = useTranslation();
  const MEMO_MAX_LENGTH = 100;
  const [memoLength, setMemoLength] = React.useState(0);
  const bridge = getAccountBridge(account);
  const onMemoChange = useCallback(
    (memo: string) => {
      track("button_clicked", {
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
  if (!status) return null;
  return (
    <Box flow={1}>
      <Box
        horizontal
        alignItems="center"
        justifyContent="space-between"
        style={{
          width: "100%",
        }}
      >
        <Label>{t("hedera.send.memo.label")}</Label>
        {/* memo character count */}
        <Text fontSize={3}>
          <Trans
            i18nKey="hedera.send.memo.characterCount"
            values={{
              memoLength,
              memoMaxLength: MEMO_MAX_LENGTH,
            }}
          />
        </Text>
      </Box>
      {/* memo input */}
      <Input maxLength={MEMO_MAX_LENGTH} onChange={onMemoChange} />
    </Box>
  );
};
export default MemoField;
