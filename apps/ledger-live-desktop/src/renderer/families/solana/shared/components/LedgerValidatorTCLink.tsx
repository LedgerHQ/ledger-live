import { getTransactionValidator } from "@ledgerhq/live-common/families/solana/transactions";
import React from "react";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import { useTranslation } from "react-i18next";
import { urls } from "~/config/urls";
import { openURL } from "~/renderer/linking";
import {
  LEDGER_VALIDATOR_BY_FIGMENT,
  LEDGER_VALIDATOR_BY_BITWISE,
} from "@ledgerhq/live-common/families/solana/staking";

import { Transaction } from "@ledgerhq/live-common/families/solana/types";
type Props = {
  transaction: Transaction;
};
export default function LedgerValidatorTCLink({ transaction }: Props) {
  const { t } = useTranslation();
  const data = getTCInfo(transaction);
  if (!data) return null;

  const openLedgerValidatorTC = () => openURL(data.url);
  return (
    <LinkWithExternalIcon
      label={t(data.label)}
      onClick={openLedgerValidatorTC}
      id="ledger-validator-tc"
    />
  );
}
const getTCInfo = (transaction: Transaction) => {
  const TC_INFO: Record<string, { label: string; url: string }> = {
    [LEDGER_VALIDATOR_BY_BITWISE.voteAccount]: {
      label: "solana.delegation.ledgerByBitwiseTC",
      url: urls.solana.ledgerByBitwiseTC,
    },
    [LEDGER_VALIDATOR_BY_FIGMENT.voteAccount]: {
      label: "solana.delegation.ledgerByFigmentTC",
      url: urls.solana.ledgerByFigmentTC,
    },
  };

  const voteAccAddr = getTransactionValidator(transaction);
  if (voteAccAddr && Object.hasOwn(TC_INFO, voteAccAddr)) {
    return TC_INFO[voteAccAddr];
  }
  return null;
};
