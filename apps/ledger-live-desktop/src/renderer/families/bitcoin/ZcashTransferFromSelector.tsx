import React, { useEffect } from "react";
import styled from "styled-components";
import { Trans } from "react-i18next";
import BigNumber from "bignumber.js";
import { useFeature } from "@features/platform-feature-flags";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction, ZcashAccount } from "@ledgerhq/live-common/families/bitcoin/types";
import type { ZcashTransaction } from "@ledgerhq/coin-bitcoin/chain-adapters/zcash/types";
import { useSelector } from "LLD/hooks/redux";
import { localeSelector } from "~/renderer/reducers/settings";
import Box from "~/renderer/components/Box/Box";
import Text from "~/renderer/components/Text";
import Label from "~/renderer/components/Label";
import Discreet, { useDiscreetMode } from "~/renderer/components/Discreet";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";

type Sender = "public" | "private";

type Props = {
  account: Account;
  transaction: Transaction;
  onChange: (t: Transaction) => void;
};

const Card = styled(Box).attrs(() => ({
  flex: "1 1 0",
  p: 3,
}))<{ $active: boolean }>`
  appearance: none;
  width: 100%;
  font: inherit;
  text-align: left;
  cursor: pointer;
  border-radius: 8px;
  border: 1px solid ${p => (p.$active ? p.theme.colors.primary.c80 : p.theme.colors.neutral.c40)};
  background-color: ${p => (p.$active ? p.theme.colors.primary.c10 : p.theme.colors.neutral.c00)};

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  &:focus-visible {
    outline: 2px solid ${p => p.theme.colors.primary.c80};
    outline-offset: 2px;
  }
`;

const CardTitle = styled(Text).attrs(() => ({
  ff: "Inter|SemiBold",
  fontSize: 4,
  color: "neutral.c100",
}))``;

const CardSubtitle = styled(Text).attrs(() => ({
  ff: "Inter|Regular",
  fontSize: 3,
  color: "neutral.c70",
}))``;

const CardAmount = styled(Text).attrs(() => ({
  ff: "Inter|Medium",
  fontSize: 3,
  color: "neutral.c80",
}))``;

const Unavailable = styled(Text).attrs(() => ({
  ff: "Inter|Regular",
  fontSize: 2,
  color: "warning.c70",
}))``;

const ZcashTransferFromSelector = ({ account, transaction, onChange }: Props) => {
  const shieldedEnabled = useFeature("zcashShielded")?.enabled ?? false;
  const isZcash = account.type === "Account" && account.currency.id === "zcash";
  const active = isZcash && shieldedEnabled;

  const bridge = useAccountBridge<ZcashTransaction>(account);
  const discreet = useDiscreetMode();
  const locale = useSelector(localeSelector);
  const unit = useAccountUnit(account);

  const tx = transaction as ZcashTransaction;

  useEffect(() => {
    if (!active) return;
    if (tx.sender !== undefined) return;
    onChange(bridge.updateTransaction(tx, { sender: "public" }) as Transaction);
  }, [active, tx.sender, bridge, onChange, tx]);

  if (!active) return null;

  const sender: Sender = tx.sender ?? "public";

  const privateInfo = (account as ZcashAccount).privateInfo;
  const fvkAvailable = Boolean(privateInfo?.ufvk);
  const orchardBalance = privateInfo?.orchardBalance ?? BigNumber(0);
  const saplingBalance = privateInfo?.saplingBalance ?? BigNumber(0);

  const totalBalance = account.balance ?? BigNumber(0);
  const privateBalance = orchardBalance.plus(saplingBalance);
  const transparentBalance = totalBalance.minus(privateBalance);

  const formatConfig = { showCode: true, discreet, locale };
  const transparentLabel = formatCurrencyUnit(unit, transparentBalance, formatConfig);
  const privateLabel = formatCurrencyUnit(unit, privateBalance, formatConfig);

  const select = (next: Sender) => {
    if (next === sender) return;
    onChange(bridge.updateTransaction(tx, { sender: next }) as Transaction);
  };

  return (
    <Box flow={1} data-testid="zcash-transfer-from-selector">
      <Label>
        <Trans i18nKey="zcash.shielded.send.transferFrom.label" />
      </Label>
      <Box horizontal flow={3}>
        <Card
          as="button"
          type="button"
          $active={sender === "public"}
          aria-pressed={sender === "public"}
          onClick={() => select("public")}
          data-testid="transfer-from-public"
        >
          <CardTitle>
            <Trans i18nKey="zcash.shielded.send.transferFrom.public.title" />
          </CardTitle>
          <CardSubtitle>
            <Trans i18nKey="zcash.shielded.send.transferFrom.public.subtitle" />
          </CardSubtitle>
          <CardAmount>
            <Discreet>{transparentLabel}</Discreet>
          </CardAmount>
        </Card>

        <Card
          as="button"
          type="button"
          $active={sender === "private"}
          aria-pressed={sender === "private"}
          disabled={!fvkAvailable}
          onClick={() => select("private")}
          data-testid="transfer-from-private"
        >
          <CardTitle>
            <Trans i18nKey="zcash.shielded.send.transferFrom.private.title" />
          </CardTitle>
          <CardSubtitle>
            <Trans i18nKey="zcash.shielded.send.transferFrom.private.subtitle" />
          </CardSubtitle>
          <CardAmount>
            <Discreet>{privateLabel}</Discreet>
          </CardAmount>
          {!fvkAvailable ? (
            <Unavailable data-testid="transfer-from-private-unavailable">
              <Trans i18nKey="zcash.shielded.send.transferFrom.private.unavailable" />
            </Unavailable>
          ) : null}
        </Card>
      </Box>
    </Box>
  );
};

export default ZcashTransferFromSelector;
