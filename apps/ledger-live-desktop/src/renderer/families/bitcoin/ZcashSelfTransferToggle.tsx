import React, { useEffect } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { useFeature } from "@features/platform-feature-flags";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/families/bitcoin/types";
import type { Transaction as ZcashTransaction, ZcashAccount } from "@ledgerhq/coin-zcash/types";
import Box from "~/renderer/components/Box/Box";
import Text from "~/renderer/components/Text";
import Label from "~/renderer/components/Label";
import Alert from "~/renderer/components/Alert";
import Switch from "~/renderer/components/Switch";

type Sender = "public" | "private";

type Props = {
  account: Account;
  transaction: Transaction;
  onChange: (t: Transaction) => void;
};

const Unavailable = styled(Text).attrs(() => ({
  ff: "Inter|Regular",
  fontSize: 2,
  color: "warning.c70",
}))``;

const ZcashSelfTransferToggle = ({ account, transaction, onChange }: Props) => {
  const shieldedEnabled = useFeature("zcashShielded")?.enabled ?? false;
  const isZcash = account.type === "Account" && account.currency.id === "zcash";
  const active = isZcash && shieldedEnabled;

  const bridge = useAccountBridge<ZcashTransaction>(account);
  const tx = transaction as unknown as ZcashTransaction;
  const sender: Sender = tx.sender === "private" ? "private" : "public";

  const privateInfo = (account as ZcashAccount).privateInfo;
  // Opposite pool from the source. Taken as-is -- never derived, decomposed or
  // recomposed here, so mainnet/testnet HRPs both flow through untouched.
  const targetAddress =
    sender === "public" ? (privateInfo?.shieldedAddress ?? null) : account.freshAddress || null;

  // Same signal the Private card uses (privateInfo.ufvk), plus the address this
  // control actually needs. Both are produced by the UFVK export flow.
  const available =
    sender === "public"
      ? Boolean(privateInfo?.ufvk) && Boolean(targetAddress)
      : Boolean(targetAddress);

  const isOn = tx.selfTransfer === true;

  // The source pool can flip after the toggle is on. Refill from whichever
  // pool is now opposite -- one effect covers both interaction orders.
  useEffect(() => {
    if (!active || !isOn || !targetAddress) return;
    if (tx.recipient === targetAddress) return;
    onChange(bridge.updateTransaction(tx, { recipient: targetAddress }) as unknown as Transaction);
  }, [active, isOn, targetAddress, tx.recipient, bridge, onChange, tx]);

  // If the source flips to a pool whose address is missing, fall back to an
  // editable empty field rather than a locked dead end.
  useEffect(() => {
    if (!active || !isOn || available) return;
    onChange(
      bridge.updateTransaction(tx, {
        selfTransfer: false,
        recipient: "",
      }) as unknown as Transaction,
    );
  }, [active, isOn, available, bridge, onChange, tx]);

  const onToggle = (next: boolean) => {
    onChange(
      bridge.updateTransaction(tx, {
        selfTransfer: next,
        recipient: next ? (targetAddress ?? "") : "",
      }) as unknown as Transaction,
    );
  };

  if (!active) return null;

  return (
    <Box flow={1} data-testid="zcash-self-transfer-toggle">
      <Box horizontal alignItems="center" justifyContent="space-between">
        <Label>
          {/* Names the DESTINATION pool, so direction is readable without the address */}
          <Trans
            i18nKey={
              sender === "public"
                ? "zcash.shielded.send.selfTransfer.toPrivate"
                : "zcash.shielded.send.selfTransfer.toPublic"
            }
          />
        </Label>
        <Switch
          small
          isChecked={isOn}
          disabled={!available}
          onChange={onToggle}
          data-testid="zcash-self-transfer-switch"
        />
      </Box>
      {!available ? (
        <Unavailable data-testid="zcash-self-transfer-unavailable">
          <Trans i18nKey="zcash.shielded.send.selfTransfer.unavailable" />
        </Unavailable>
      ) : null}
      {isOn && sender === "private" ? (
        <Alert type="warning" mt={2} data-testid="zcash-self-transfer-privacy-warning">
          <Trans i18nKey="zcash.shielded.send.selfTransfer.privacyWarning" />
        </Alert>
      ) : null}
    </Box>
  );
};

export default ZcashSelfTransferToggle;
