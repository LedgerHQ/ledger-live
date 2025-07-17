import React, { useCallback } from "react";
import styled from "styled-components";
import { Trans } from "react-i18next";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getUTXOStatus } from "@ledgerhq/live-common/families/bitcoin/logic";
import TrackPage from "~/renderer/analytics/TrackPage";
import Button from "~/renderer/components/Button";
import Box from "~/renderer/components/Box";
import FormattedVal from "~/renderer/components/FormattedVal";
import Text from "~/renderer/components/Text";
import Modal, { ModalBody } from "~/renderer/components/Modal";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import { urls } from "~/config/urls";
import { openURL } from "~/renderer/linking";
import { PickingStrategy } from "./PickingStrategy";
import { CoinControlRow } from "./CoinControlRow";
import {
  BitcoinAccount as Account,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/bitcoin/types";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import CopyWithFeedback from "~/renderer/components/CopyWithFeedback";
import { getDefaultExplorerView, getAddressExplorer } from "@ledgerhq/live-common/explorers";
// import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
// import { openURL } from "~/renderer/linking";
import { SplitAddress } from "~/renderer/components/OperationsList/AddressCell";
import { useMemo } from "react";

type Props = {
  isOpened?: boolean;
  onClose: () => void;
  account: Account;
  transaction: Transaction;
  onChange: (a: (t: Transaction, p: Partial<Transaction>) => void) => void;
  updateTransaction: (updater: (t: Transaction) => Transaction) => void;
  status: TransactionStatus;
};
const Separator = styled.div`
  width: 100%;
  height: 1px;
  background-color: ${p => p.theme.colors.palette.text.shade10};
  margin: 20px 0;
`;
const CoinControlModal = ({
  isOpened,
  onClose,
  account,
  transaction,
  onChange,
  status,
  updateTransaction,
}: Props) => {
  const onClickLink = useCallback(() => openURL(urls.coinControl), []);

  const unit = useAccountUnit(account);
  const explorerView = getDefaultExplorerView(account.currency);
  if (!account.bitcoinResources) return null;
  const { bitcoinResources } = account;
  const { utxoStrategy } = transaction;
  const totalExcludedUTXOS = account.bitcoinResources?.utxos
    .map(u => getUTXOStatus(u, utxoStrategy))
    .filter(({ excluded }) => excluded).length;
  const bridge = getAccountBridge(account);
  const errorKeys = Object.keys(status.errors);
  const error = errorKeys.length ? status.errors[errorKeys[0]] : null;
  const returning = (status.txOutputs || []).find(output => !!output.isChange);
  const legacyUtxoKeys = new Set(
    bitcoinResources.utxos.map(utxo => `${utxo.hash}:${utxo.outputIndex}`),
  );

  const explorerUtxoKeys = new Set(
    (bitcoinResources.utxosExplorer || []).map(utxo => `${utxo.hash}:${utxo.outputIndex}`),
  );

  return (
    <Modal width={1200} isOpened={isOpened} centered onClose={onClose}>
      <TrackPage category="Modal" name="BitcoinCoinControl" />
      <ModalBody
        title={<Trans i18nKey="bitcoin.modalTitle" />}
        onClose={onClose}
        render={() => (
          <Box flow={2}>
            <PickingStrategy transaction={transaction} account={account} onChange={onChange} />

            <Separator />

            <Box mt={0} mb={4} horizontal justifyContent="space-between">
              <Text color="palette.text.shade50" ff="Inter|Regular" fontSize={13}>
                <Trans i18nKey="bitcoin.selected" />
              </Text>
              <Box horizontal>
                <Text
                  color="palette.text.shade50"
                  ff="Inter|Medium"
                  fontSize={13}
                  style={{ paddingRight: 5 }}
                >
                  <Trans i18nKey="bitcoin.amount" />
                </Text>
                <Text ff="Inter|Medium" fontSize={13}>
                  <FormattedVal
                    disableRounding
                    val={status.totalSpent}
                    unit={unit}
                    showCode
                    fontSize={4}
                    color="palette.text.shade100"
                  />
                </Text>
              </Box>
            </Box>
            <Box flow={2} horizontal>
              <Box flex={1} pr={2}>
                <Text ff="Inter|Bold" fontSize={3}>
                  Legacy UTXOs
                </Text>
                {bitcoinResources.utxos.map(utxo => {
                  const key = `${utxo.hash}:${utxo.outputIndex}`;
                  const highlight = !explorerUtxoKeys.has(key); // ❗️unique to legacy
                  return (
                    <CoinControlRow
                      key={`legacy-${key}`}
                      utxo={utxo}
                      highlight={highlight}
                      utxoStrategy={utxoStrategy}
                      totalExcludedUTXOS={totalExcludedUTXOS}
                      updateTransaction={updateTransaction}
                      bridge={bridge}
                      status={status}
                      account={account}
                    />
                  );
                })}
              </Box>

              <Box flex={1} pl={2}>
                <Text ff="Inter|Bold" fontSize={3}>
                  Explorer UTXOs
                </Text>
                {(bitcoinResources.utxosExplorer || []).map(utxo => {
                  const key = `${utxo.hash}:${utxo.outputIndex}`;
                  const highlight = !legacyUtxoKeys.has(key); // ❗️unique to explorer
                  return (
                    <CoinControlRow
                      key={`explorer-${key}`}
                      utxo={utxo}
                      highlight={highlight}
                      utxoStrategy={utxoStrategy}
                      totalExcludedUTXOS={totalExcludedUTXOS}
                      updateTransaction={updateTransaction}
                      bridge={bridge}
                      status={status}
                      account={account}
                    />
                  );
                })}
              </Box>
            </Box>
          </Box>
        )}
        renderFooter={() => (
          <>
            {error ? null : (
              <Box
                flow={4}
                alignItems="center"
                horizontal
                style={{
                  flexBasis: "50%",
                }}
              >
                <Box grow>
                  <Box horizontal alignItems="center" mb={2}>
                    <Box
                      style={{
                        flexBasis: "40%",
                      }}
                    >
                      <Text ff="Inter|Medium" fontSize={3} color="palette.text.shade50">
                        <Trans i18nKey="bitcoin.toSpend" />
                      </Text>
                    </Box>
                    <FormattedVal
                      disableRounding
                      val={status.totalSpent}
                      unit={unit}
                      showCode
                      fontSize={4}
                      ff="Inter|SemiBold"
                      color="palette.text.shade100"
                    />
                  </Box>
                  <Box horizontal alignItems="center">
                    <Box
                      style={{
                        flexBasis: "40%",
                      }}
                    >
                      <Text ff="Inter|Medium" fontSize={3} color="palette.text.shade50">
                        <Trans i18nKey="bitcoin.toReturn" />
                      </Text>
                    </Box>
                    <FormattedVal
                      disableRounding
                      val={returning ? returning.value : 0}
                      unit={unit}
                      showCode
                      fontSize={4}
                      ff="Inter|SemiBold"
                      color="palette.text.shade100"
                    />
                  </Box>
                </Box>
              </Box>
            )}
            <Box grow />
            <LinkWithExternalIcon onClick={onClickLink}>
              <Trans i18nKey="bitcoin.whatIs" />
            </LinkWithExternalIcon>
            <Button primary onClick={onClose}>
              <Trans i18nKey="common.done" />
            </Button>
          </>
        )}
      />
    </Modal>
  );
};
export default CoinControlModal;
