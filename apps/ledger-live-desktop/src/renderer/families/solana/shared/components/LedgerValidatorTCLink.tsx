import React from "react";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import { useTranslation } from "react-i18next";
import { urls } from "~/config/urls";
import { openURL } from "~/renderer/linking";
import {
  LEDGER_VALIDATORS_VOTE_ACCOUNTS,
  LEDGER_VALIDATOR_BY_FIGMENT,
  LEDGER_VALIDATOR_BY_CHORUS_ONE,
} from "@ledgerhq/live-common/families/solana/staking";

import { Transaction } from "@ledgerhq/live-common/families/solana/types";
type Props = {
  transaction: Transaction;
};
export default function LedgerValidatorTCLink({ transaction }: Props) {
  const { t } = useTranslation();
  if (!shouldShowTC(transaction)) return null;

  const data = getTCInfo(transaction);
  if (!data) return null;

  const openLedgerValidatorTC = () => openURL(data.url);
  return <LinkWithExternalIcon label={t(data.label)} onClick={openLedgerValidatorTC} />;
}
const shouldShowTC = ({ model }: Transaction) => {
  switch (model.kind) {
    case "stake.createAccount":
      return LEDGER_VALIDATORS_VOTE_ACCOUNTS.includes(model.uiState.delegate.voteAccAddress);
    case "stake.delegate":
      return LEDGER_VALIDATORS_VOTE_ACCOUNTS.includes(model.uiState.voteAccAddr);
    default:
      break;
  }
  return false;
};

const getTCInfo = ({ model }: Transaction) => {
  const TC_INFO: Record<string, { label: string; url: string }> = {
    [LEDGER_VALIDATOR_BY_CHORUS_ONE.voteAccount]: {
      label: "solana.delegation.ledgerByChorusOneTC",
      url: urls.solana.ledgerByChorusOneTC,
    },
    [LEDGER_VALIDATOR_BY_FIGMENT.voteAccount]: {
      label: "solana.delegation.ledgerByFigmentTC",
      url: urls.solana.ledgerByFigmentTC,
    },
  };

  switch (model.kind) {
    case "stake.createAccount":
      return TC_INFO[model.uiState.delegate.voteAccAddress];
    case "stake.delegate":
      return TC_INFO[model.uiState.voteAccAddr];
    default:
      break;
  }
  return null;
};
