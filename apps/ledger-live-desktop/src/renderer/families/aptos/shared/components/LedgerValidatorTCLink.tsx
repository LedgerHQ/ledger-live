// import React from "react";
// import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
// import { useTranslation } from "react-i18next";
// import { urls } from "~/config/urls";
// import { openURL } from "~/renderer/linking";
// import {
//   LEDGER_VALIDATORS_VOTE_ACCOUNTS,
//   LEDGER_VALIDATOR_BY_FIGMENT,
//   LEDGER_VALIDATOR_BY_CHORUS_ONE,
// } from "@ledgerhq/live-common/families/solana/staking";
import { Transaction } from "@ledgerhq/live-common/families/aptos/types";

type Props = {
  transaction: Transaction;
};

export default function LedgerValidatorTCLink({ transaction: _t }: Props) {
  // const { t } = useTranslation();
  // // if (!shouldShowTC(transaction)) return null;

  // const data = getTCInfo(transaction);
  // if (!data) return null;

  // const openLedgerValidatorTC = () => openURL(data.url);
  // return (
  //   <LinkWithExternalIcon
  //     label={t(data.label)}
  //     onClick={openLedgerValidatorTC}
  //     id="ledger-validator-tc"
  //   />
  // );

  return null;
}
// const shouldShowTC = ({ stake }: Transaction) => {
//   if (!stake) return false;

//   switch (stake.op) {
//     case "add":
//       return LEDGER_VALIDATORS_VOTE_ACCOUNTS.includes(stake.poolAddr);
//     default:
//       break;
//   }

//   return false;
// };

// const getTCInfo = ({ stake }: Transaction) => {
//   const TC_INFO: Record<string, { label: string; url: string }> = {
//     [LEDGER_VALIDATOR_BY_CHORUS_ONE.voteAccount]: {
//       label: "aptos.delegation.ledgerByChorusOneTC",
//       url: urls.solana.ledgerByChorusOneTC,
//     },
//     [LEDGER_VALIDATOR_BY_FIGMENT.voteAccount]: {
//       label: "aptos.delegation.ledgerByFigmentTC",
//       url: urls.solana.ledgerByFigmentTC,
//     },
//   };

//   if (!stake) return null;

//   switch (stake.op) {
//     case "add":
//       return TC_INFO[stake.poolAddr];
//     default:
//       break;
//   }

//   return null;
// };
