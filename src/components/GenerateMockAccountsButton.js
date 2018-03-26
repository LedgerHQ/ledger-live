// @flow
import React from "react";
import { connect } from "react-redux";
import { genAccount } from "@ledgerhq/wallet-common/lib/mock/account";
import GreyButton from "./GreyButton";
import { accountModel } from "../reducers/accounts";
import { initAccounts } from "../actions/accounts";
import db from "../db";

async function injectMockAccountsInDB(count) {
  await db.save(
    "accounts",
    Array(count)
      .fill(null)
      .map(() => accountModel.encode(genAccount(String(Math.random()))))
  );
}

const GenerateMockAccountsButton = ({
  title,
  initAccounts
}: {
  initAccounts: () => *,
  title: string
}) => (
  <GreyButton
    title={title}
    onPress={async () => {
      await injectMockAccountsInDB(12);
      await initAccounts();
    }}
  />
);

export default connect(null, { initAccounts })(GenerateMockAccountsButton);
