// @flow
import React from "react";
import { genAccount } from "@ledgerhq/live-common/lib/mock/account";
import BlueButton from "./BlueButton";
import { accountModel } from "../reducers/accounts";
import db from "../db";
import { withReboot } from "../context/Reboot";

async function injectMockAccountsInDB(count) {
  await db.save("accounts", {
    active: Array(count)
      .fill(null)
      .map(() => accountModel.encode(genAccount(String(Math.random()))))
  });
}

const GenerateMockAccountsButton = ({
  title,
  reboot
}: {
  title: string,
  reboot: *
}) => (
  <BlueButton
    title={title}
    onPress={async () => {
      await injectMockAccountsInDB(12);
      reboot();
    }}
  />
);

export default withReboot(GenerateMockAccountsButton);
