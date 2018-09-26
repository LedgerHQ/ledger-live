// @flow
import React from "react";
import sample from "lodash/sample";
import { genAccount } from "@ledgerhq/live-common/lib/mock/account";
import Button from "./Button";
import { accountModel } from "../reducers/accounts";
import db from "../db";
import { withReboot } from "../context/Reboot";
import { listCryptoCurrencies } from "../cryptocurrencies";

async function injectMockAccountsInDB(count) {
  await db.save("accounts", {
    active: Array(count)
      .fill(null)
      .map(() =>
        accountModel.encode(
          genAccount(String(Math.random()), {
            currency: sample(listCryptoCurrencies()),
          }),
        ),
      ),
  });
}

const GenerateMockAccountsButton = ({
  reboot,
  count,
  ...rest
}: {
  title: string,
  count: number,
  reboot: *,
}) => (
  <Button
    {...rest}
    type="secondary"
    onPress={async () => {
      await injectMockAccountsInDB(count);
      reboot();
    }}
  />
);

export default withReboot(GenerateMockAccountsButton);
