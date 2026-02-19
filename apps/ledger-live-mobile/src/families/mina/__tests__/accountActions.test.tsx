import React from "react";
import { render } from "@testing-library/react-native";
import { Text } from "react-native";
import accountActions from "../accountActions";
import { createMockMinaAccount, createDelegatingMinaAccount } from "./testUtils";
import type { Account } from "@ledgerhq/types-live";

describe("accountActions", () => {
  const { getMainActions } = accountActions;

  it("returns an array with one stake action", () => {
    const account = createMockMinaAccount();
    const actions = getMainActions({
      account,
      parentAccount: undefined as unknown as Account,
    });

    expect(actions).toHaveLength(1);
    expect(actions[0].id).toBe("stake");
  });

  it("returns earn label when account has no delegation", () => {
    const account = createMockMinaAccount();
    const actions = getMainActions({
      account,
      parentAccount: undefined as unknown as Account,
    });

    const { getByText } = render(<Text>{actions[0].label}</Text>);
    expect(getByText("Earn")).toBeTruthy();
  });

  it("returns redelegate label when account has active delegation", () => {
    const account = createDelegatingMinaAccount();
    const actions = getMainActions({
      account,
      parentAccount: undefined as unknown as Account,
    });

    const { getByText } = render(<Text>{actions[0].label}</Text>);
    expect(getByText("Redelegate")).toBeTruthy();
  });

  it("includes MINA in event properties", () => {
    const account = createMockMinaAccount();
    const actions = getMainActions({
      account,
      parentAccount: undefined as unknown as Account,
    });

    expect(actions[0].eventProperties).toEqual({ currency: "MINA" });
  });

  it("includes navigation params pointing to MinaStakingValidator screen", () => {
    const account = createMockMinaAccount();
    const actions = getMainActions({
      account,
      parentAccount: undefined as unknown as Account,
    });

    expect(actions[0].navigationParams).toBeDefined();
    expect(actions[0].navigationParams![1]).toMatchObject({
      params: { accountId: account.id },
    });
  });

  it("includes CoinsMedium icon", () => {
    const account = createMockMinaAccount();
    const actions = getMainActions({
      account,
      parentAccount: undefined as unknown as Account,
    });

    expect(actions[0].Icon).toBeDefined();
  });
});
