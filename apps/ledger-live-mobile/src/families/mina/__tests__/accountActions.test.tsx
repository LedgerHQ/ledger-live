import React from "react";
import { render, screen } from "@tests/test-renderer";
import { Text } from "react-native";
import accountActions from "../accountActions";
import { createMockMinaAccount, createDelegatingMinaAccount } from "./testUtils";
import type { Account } from "@ledgerhq/types-live";
import type { MinaAccount } from "@ledgerhq/live-common/families/mina/types";

const { getMainActions } = accountActions;

const mainActions = (account: MinaAccount) =>
  getMainActions({ account, parentAccount: undefined as unknown as Account });

describe("accountActions", () => {
  it("offers a single stake action pointing at the validator step", () => {
    const account = createMockMinaAccount();
    const actions = mainActions(account);

    expect(actions).toHaveLength(1);
    expect(actions[0].id).toBe("stake");
    expect(actions[0].eventProperties).toEqual({ currency: "MINA" });
    expect(actions[0].navigationParams![1]).toMatchObject({
      params: { accountId: account.id },
    });
  });

  it("labels the action Earn when the account does not delegate", () => {
    render(<Text>{mainActions(createMockMinaAccount())[0].label}</Text>);

    expect(screen.getByText("Earn")).toBeOnTheScreen();
  });

  it("labels the action Redelegate when the account already delegates", () => {
    render(<Text>{mainActions(createDelegatingMinaAccount())[0].label}</Text>);

    expect(screen.getByText("Redelegate")).toBeOnTheScreen();
  });
});
