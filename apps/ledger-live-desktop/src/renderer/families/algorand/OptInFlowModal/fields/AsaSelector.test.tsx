import React from "react";
import type { TFunction } from "i18next";
import { render } from "tests/testSetup";
import type {
  AlgorandAccount,
  AlgorandGenericTransaction,
} from "@ledgerhq/live-common/families/algorand/types";
import AsaSelector from "./AsaSelector";

const held = { id: "algorand/asa/1", name: "Held" };
const fresh = { id: "algorand/asa/2", name: "Fresh" };
const mockSelect = jest.fn();
const t = ((key: string) => key) as unknown as TFunction;

jest.mock("@features/platform-currencies", () => ({
  useTokensData: () => ({ data: { tokens: [held, fresh] } }),
}));
jest.mock("~/renderer/components/Select", () => ({
  __esModule: true,
  default: (props: unknown) => {
    mockSelect(props);
    return null;
  },
}));

describe("AsaSelector", () => {
  it("disables an already-held asset on an account without algorandResources", () => {
    const account = {
      subAccounts: [{ type: "TokenAccount", token: held }],
    } as unknown as AlgorandAccount;
    const transaction = { family: "algorand", mode: "changeTrust" } as AlgorandGenericTransaction;

    render(<AsaSelector account={account} transaction={transaction} t={t} onChange={jest.fn()} />);

    const { isOptionDisabled } = mockSelect.mock.lastCall[0];
    expect(isOptionDisabled(held)).toBe(true);
    expect(isOptionDisabled(fresh)).toBe(false);
  });

  it("shows the selected asset from the generic asset reference", () => {
    const account = { subAccounts: [] } as unknown as AlgorandAccount;
    const transaction = {
      family: "algorand",
      mode: "changeTrust",
      assetReference: "2",
    } as AlgorandGenericTransaction;

    render(<AsaSelector account={account} transaction={transaction} t={t} onChange={jest.fn()} />);

    expect(mockSelect.mock.lastCall[0].value).toBe(fresh);
  });
});
