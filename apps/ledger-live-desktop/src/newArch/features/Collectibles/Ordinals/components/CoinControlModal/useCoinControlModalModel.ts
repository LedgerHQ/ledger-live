import {
  BitcoinAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/bitcoin/types";
import { useCallback } from "react";
import { urls } from "~/config/urls";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { openURL } from "~/renderer/linking";
import { getUTXOStatus } from "@ledgerhq/live-common/families/bitcoin/logic";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getDefaultAccountName } from "@ledgerhq/live-wallet/accountName";
import { useMaybeAccountName } from "~/renderer/reducers/wallet";

export type Props = {
  isOpened?: boolean;
  account: BitcoinAccount;
  transaction: Transaction;
  status: TransactionStatus;
  onClose: () => void;
  onChange: (transaction: (t: Transaction, p: Partial<Transaction>) => void) => void;
  updateTransaction: (updater: (t: Transaction) => Transaction) => void;
};

export const useCoinControlModalModel = ({
  isOpened,
  account,
  transaction,
  status,
  onClose,
  onChange,
  updateTransaction,
}: Props) => {
  const onClickLink = useCallback(() => openURL(urls.coinControl), []);
  const unit = useAccountUnit(account);
  const { bitcoinResources } = account;
  const { utxoStrategy } = transaction;
  const totalExcludedUTXOS = bitcoinResources?.utxos
    .map(u => getUTXOStatus(u, utxoStrategy))
    .filter(({ excluded }) => excluded).length;

  const bridge = getAccountBridge(account);
  const errorKeys = Object.keys(status.errors);
  const error = errorKeys.length ? status.errors[errorKeys[0]] : null;
  const returning = (status.txOutputs || []).find(output => !!output.isChange);

  const accountName = useMaybeAccountName(account) || getDefaultAccountName(account);

  return {
    account,
    isOpened,
    unit,
    bitcoinResources,
    totalExcludedUTXOS,
    bridge,
    error,
    returning,
    utxoStrategy,
    transaction,
    status,
    accountName,
    onClose,
    onChange,
    updateTransaction,
    onClickLink,
  };
};
