import React from "react";
import { Account } from "@ledgerhq/types-live";
import Inscriptions from "../../components/Inscriptions";

type Props = {
  account: Account;
};

const OrdinalsAccount: React.FC<Props> = ({ account }) => {
  return <Inscriptions account={account} />;
  // here we will add the rare sats table
};

export default OrdinalsAccount;
