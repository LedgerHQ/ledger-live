// @flow
import React from "react";
import { connect } from "react-redux";
import GreyButton from "./GreyButton";
import { deserializeAccounts } from "../reducers/accounts";
import { genAccount } from "../mock/account";
import { initAccounts } from "../actions/accounts";
import db from "../db";

async function injectMockAccountsInDB(count) {
  await db.save(
    "accounts",
    deserializeAccounts(
      Array(count)
        .fill(null)
        .map((_, i) => genAccount(i))
    )
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
