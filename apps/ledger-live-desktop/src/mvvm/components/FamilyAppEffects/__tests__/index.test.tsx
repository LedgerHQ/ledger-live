import React from "react";
import { render, screen } from "tests/testSetup";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import type { Account } from "@ledgerhq/types-live";
import { getFamilyAppEffect } from "~/renderer/families";
import { FamilyAppEffects } from "../index";

jest.mock("~/renderer/families", () => ({
  getFamilyAppEffect: jest.fn(() => undefined),
}));
const mockedGetFamilyAppEffect = jest.mocked(getFamilyAppEffect);

const accountOf = (id: string, family: string): Account =>
  ({
    ...createFixtureAccount(),
    id,
    currency: { ...createFixtureAccount().currency, family },
  }) as Account;

const effectOf = (family: string) => () => <div data-testid={`effect-${family}`} />;

const Failing = () => {
  throw new Error("chunk load failed");
};

describe("FamilyAppEffects", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetFamilyAppEffect.mockReset();
  });

  it("mounts the effect of each family held once, whatever the number of accounts", () => {
    mockedGetFamilyAppEffect.mockImplementation(effectOf);
    render(<FamilyAppEffects />, {
      initialState: {
        accounts: [accountOf("a1", "bitcoin"), accountOf("a2", "bitcoin"), accountOf("a3", "evm")],
      },
    });

    expect(screen.getAllByTestId("effect-bitcoin")).toHaveLength(1);
    expect(screen.getAllByTestId("effect-evm")).toHaveLength(1);
    expect(mockedGetFamilyAppEffect.mock.calls).toEqual([["bitcoin"], ["evm"]]);
  });

  it("renders nothing for a family without an app effect", () => {
    const { container } = render(<FamilyAppEffects />, {
      initialState: { accounts: [accountOf("a1", "evm")] },
    });

    expect(container).toBeEmptyDOMElement();
  });

  it("never looks up a family the user holds no account of", () => {
    render(<FamilyAppEffects />, { initialState: { accounts: [] } });

    expect(mockedGetFamilyAppEffect).not.toHaveBeenCalled();
  });

  it("keeps the other families running when one effect fails", () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    mockedGetFamilyAppEffect.mockImplementation(family =>
      family === "bitcoin" ? Failing : effectOf(family),
    );
    render(<FamilyAppEffects />, {
      initialState: { accounts: [accountOf("a1", "bitcoin"), accountOf("a2", "evm")] },
    });

    expect(screen.getByTestId("effect-evm")).toBeInTheDocument();
  });
});
