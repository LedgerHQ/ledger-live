import React from "react";
import { render, screen } from "tests/testSetup";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import type { Account } from "@ledgerhq/types-live";
import { useLLDCoinFamily } from "~/renderer/families";
import { FamilyAppEffects } from "../index";

jest.mock("~/renderer/families", () => ({
  useLLDCoinFamily: jest.fn(() => ({})),
}));
const mockedUseLLDCoinFamily = jest.mocked(useLLDCoinFamily);

const accountOf = (id: string, family: string): Account =>
  ({
    ...createFixtureAccount(),
    id,
    currency: { ...createFixtureAccount().currency, family },
  }) as Account;

const effectOf = (family: string) => () => <div data-testid={`effect-${family}`} />;

describe("FamilyAppEffects", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("mounts the effect of each family held once, whatever the number of accounts", () => {
    mockedUseLLDCoinFamily.mockImplementation(family => ({
      AppEffect: effectOf(family ?? ""),
    }));
    render(<FamilyAppEffects />, {
      initialState: {
        accounts: [accountOf("a1", "bitcoin"), accountOf("a2", "bitcoin"), accountOf("a3", "evm")],
      },
    });

    expect(screen.getAllByTestId("effect-bitcoin")).toHaveLength(1);
    expect(screen.getAllByTestId("effect-evm")).toHaveLength(1);
  });

  it("renders nothing for a family without an app effect", () => {
    mockedUseLLDCoinFamily.mockReturnValue({});
    const { container } = render(<FamilyAppEffects />, {
      initialState: { accounts: [accountOf("a1", "evm")] },
    });

    expect(container).toBeEmptyDOMElement();
  });

  it("never loads a family the user holds no account of", () => {
    render(<FamilyAppEffects />, { initialState: { accounts: [] } });

    expect(mockedUseLLDCoinFamily).not.toHaveBeenCalled();
  });

  it("keeps the other families running when one effect fails", () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    const Failing = () => {
      throw new Error("chunk load failed");
    };
    mockedUseLLDCoinFamily.mockImplementation(family =>
      family === "bitcoin" ? { AppEffect: Failing } : { AppEffect: effectOf(family ?? "") },
    );
    render(<FamilyAppEffects />, {
      initialState: { accounts: [accountOf("a1", "bitcoin"), accountOf("a2", "evm")] },
    });

    expect(screen.getByTestId("effect-evm")).toBeInTheDocument();
  });
});
