import React from "react";
import styled from "styled-components";
import { Trans } from "react-i18next";
import { getUTXOStatus } from "@ledgerhq/live-common/families/bitcoin/logic";
import { AccountBridge } from "@ledgerhq/types-live";
import Checkbox from "~/renderer/components/CheckBox";
import FormattedVal from "~/renderer/components/FormattedVal";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import Tooltip from "~/renderer/components/Tooltip";
import InfoCircle from "~/renderer/icons/InfoCircle";
import { SplitAddress, Cell } from "~/renderer/components/OperationsList/AddressCell";
import {
  BitcoinAccount,
  BitcoinOutput,
  Transaction,
  TransactionStatus,
  UtxoStrategy,
} from "@ledgerhq/live-common/families/bitcoin/types";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";

type CoinControlRowProps = {
  utxo: BitcoinOutput;
  utxoStrategy: UtxoStrategy;
  status: TransactionStatus;
  account: BitcoinAccount;
  totalExcludedUTXOS: number;
  updateTransaction: (updater: (t: Transaction) => Transaction) => void;
  bridge: AccountBridge<Transaction>;
};
const Container = styled(Box).attrs<{
  disabled: boolean;
  onClick: () => void;
}>(p => ({
  opacity: p.disabled ? 0.5 : 1,
  horizontal: true,
}))<{
  disabled: boolean;
  onClick: () => void;
}>`
  padding: 15px;
  border-radius: 4px;
  align-items: center;
  border: 1px solid ${p => p.theme.colors.palette.text.shade20};
  ${p =>
    p.disabled
      ? `
    background-color: ${p.theme.colors.palette.text.shade10};
    `
      : `
      cursor: pointer;
    `}

  &:hover {
    border-color: ${p =>
      p.disabled ? p.theme.colors.palette.text.shade20 : p.theme.colors.palette.primary.main};
  }
`;
export const CoinControlRow = ({
  utxo,
  utxoStrategy,
  status,
  account,
  totalExcludedUTXOS,
  updateTransaction,
  bridge,
}: CoinControlRowProps) => {
  const unit = useAccountUnit(account);
  const s = getUTXOStatus(utxo, utxoStrategy);
  const utxoStatus = s.excluded ? s.reason || "" : "";
  const input = (status.txInputs || []).find(
    input => input.previousOutputIndex === utxo.outputIndex && input.previousTxHash === utxo.hash,
  );
  const unconfirmed = utxoStatus === "pickPendingUtxo";
  const last = !s.excluded && totalExcludedUTXOS + 1 === account.bitcoinResources?.utxos.length; // make sure that at least one utxo is selected
  const disabled = unconfirmed || last;
  const confirmations = utxo.blockHeight ? account.blockHeight - utxo.blockHeight : 0;
  const onClick = () => {
    if (disabled) return;
    const patch = {
      utxoStrategy: {
        ...utxoStrategy,
        excludeUTXOs: !s.excluded
          ? utxoStrategy.excludeUTXOs.concat({
              hash: utxo.hash,
              outputIndex: utxo.outputIndex,
            })
          : utxoStrategy.excludeUTXOs.filter(
              e => e.hash !== utxo.hash || e.outputIndex !== utxo.outputIndex,
            ),
      },
    };
    updateTransaction((t: Transaction) => bridge.updateTransaction(t, patch));
  };
  return (
    <Container disabled={unconfirmed} flow={2} horizontal alignItems="center" onClick={onClick}>
      {unconfirmed ? (
        <Tooltip content={<Trans i18nKey={"bitcoin.cannotSelect.pending"} />}>
          <InfoCircle size={16} />
        </Tooltip>
      ) : last ? (
        <Tooltip content={<Trans i18nKey={"bitcoin.cannotSelect.last"} />}>
          <Checkbox isChecked disabled />
        </Tooltip>
      ) : (
        <Checkbox isChecked={!s.excluded} onChange={onClick} />
      )}
      <Box
        style={{
          flexBasis: "10%",
        }}
      >
        {input && !disabled ? (
          <Text
            ff="Inter|Bold"
            fontSize={2}
            color="wallet"
            style={{
              lineHeight: "10px",
            }}
          >
            <Trans i18nKey="bitcoin.inputSelected" />
          </Text>
        ) : null}
      </Box>
      <Box
        style={{
          flexBasis: "30%",
        }}
      >
        <FormattedVal
          disableRounding
          val={utxo.value}
          unit={unit}
          showCode
          fontSize={4}
          color="palette.text.shade100"
          ff="Inter|SemiBold"
        />
        {utxo.blockHeight ? (
          <Text ff="Inter|Medium" fontSize={3} color={"palette.text.shade50"}>
            {confirmations + ` confirmation${confirmations > 1 ? "s" : ""}`}
          </Text>
        ) : (
          <Text ff="Inter|Medium" fontSize={3} color={"alertRed"}>
            <Trans i18nKey="bitcoin.pending" />
          </Text>
        )}
      </Box>
      <Box
        style={{
          flex: 1,
        }}
      >
        <Text color="palette.text.shade100" ff="Inter|SemiBold" fontSize={4}>
          <SplitAddress value={utxo.address || ""} />
        </Text>

        <Box horizontal justifyContent="flex-start">
          <Text
            style={{
              whiteSpace: "nowrap",
            }}
            color="palette.text.shade50"
            ff="Inter|Medium"
            fontSize={3}
          >
            #{utxo.outputIndex} of
          </Text>
          <Cell
            grow
            shrink
            style={{
              display: "block",
              marginLeft: 4,
            }}
            px={0}
          >
            <Text
              style={{
                whiteSpace: "nowrap",
              }}
              color="palette.text.shade50"
              ff="Inter|Medium"
              fontSize={3}
            >
              <SplitAddress value={utxo.hash} />
            </Text>
          </Cell>
        </Box>
      </Box>
    </Container>
  );
};
