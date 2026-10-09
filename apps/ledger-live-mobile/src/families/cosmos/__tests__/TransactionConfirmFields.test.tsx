import React from "react";
import BigNumber from "bignumber.js";
import { screen } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/families/cosmos/types";
import TransactionConfirmFields from "../TransactionConfirmFields";

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useTheme: () => ({ colors: { live: "#0af", grey: "#999", white: "#fff" } }),
}));
jest.mock("LLM/hooks/useAccountUnit", () => ({
  useAccountUnit: () => ({ code: "ATOM", name: "Cosmos", magnitude: 6 }),
}));
jest.mock("@ledgerhq/live-common/families/cosmos/react", () => ({
  useCosmosFamilyPreloadData: () => ({
    validators: [
      { validatorAddress: "cosmosvaloper1src", name: "Source Val" },
      { validatorAddress: "cosmosvaloper1dst", name: "Dest Val" },
    ],
  }),
}));

const { fieldComponents } = TransactionConfirmFields;
const DelegateValidatorsField = fieldComponents["cosmos.delegateValidators"];
const ValidatorNameField = fieldComponents["cosmos.validatorName"];
const SourceValidatorNameField = fieldComponents["cosmos.sourceValidatorName"];

const account = { currency: getCryptoCurrencyById("cosmos") } as unknown as Account;
const field = { type: "cosmos.validatorName", label: "Validator" };

const baseTx = {
  family: "cosmos",
  recipient: "",
  memo: null,
  fees: null,
  gas: null,
  networkInfo: null,
  useAllAmount: false,
  sourceValidator: null,
  validators: [],
} as const;

const tx = (patch: Partial<Transaction>) => ({ ...baseTx, ...patch }) as unknown as Transaction;

describe("cosmos TransactionConfirmFields", () => {
  describe("CosmosDelegateValidatorsField", () => {
    it("renders amount and validator from the generic valAddress/amount shape", () => {
      render(
        <DelegateValidatorsField
          account={account}
          transaction={tx({
            mode: "delegate",
            valAddress: "cosmosvaloper1src",
            amount: new BigNumber(2_000_000),
          })}
          field={field}
        />,
      );
      expect(screen.getByText(/2/)).toBeVisible();
      expect(screen.getByText("Source Val")).toBeVisible();
    });

    it("targets dstValAddress for a redelegation", () => {
      render(
        <DelegateValidatorsField
          account={account}
          transaction={tx({
            mode: "redelegate",
            valAddress: "cosmosvaloper1src",
            dstValAddress: "cosmosvaloper1dst",
            amount: new BigNumber(1_000_000),
          })}
          field={field}
        />,
      );
      expect(screen.getByText("Dest Val")).toBeVisible();
      expect(screen.queryByText("Source Val")).toBeNull();
    });

    it("renders nothing, without crashing, when no validator is set", () => {
      render(
        <DelegateValidatorsField
          account={account}
          transaction={tx({ mode: "delegate", amount: new BigNumber(0) })}
          field={field}
        />,
      );
      expect(screen.queryByText("Source Val")).toBeNull();
    });
  });

  describe("CosmosValidatorNameField", () => {
    it("shows the validator name from valAddress", () => {
      render(
        <ValidatorNameField
          account={account}
          transaction={tx({ mode: "undelegate", valAddress: "cosmosvaloper1src" })}
          field={field}
        />,
      );
      expect(screen.getByText("Source Val")).toBeVisible();
    });

    it("falls back to the raw address for an unknown validator", () => {
      render(
        <ValidatorNameField
          account={account}
          transaction={tx({ mode: "claimReward", valAddress: "cosmosvaloper1unknown" })}
          field={field}
        />,
      );
      expect(screen.getByText("cosmosvaloper1unknown")).toBeVisible();
    });

    it("renders nothing when no validator is set", () => {
      render(
        <ValidatorNameField
          account={account}
          transaction={tx({ mode: "claimReward" })}
          field={field}
        />,
      );
      expect(screen.queryByText("Validator")).toBeNull();
    });
  });

  describe("CosmosSourceValidatorNameField", () => {
    it("reads the source validator from valAddress on a redelegation", () => {
      render(
        <SourceValidatorNameField
          account={account}
          transaction={tx({
            mode: "redelegate",
            valAddress: "cosmosvaloper1src",
            dstValAddress: "cosmosvaloper1dst",
          })}
          field={field}
        />,
      );
      expect(screen.getByText("Source Val")).toBeVisible();
    });

    it("renders nothing when there is no source validator", () => {
      render(
        <SourceValidatorNameField
          account={account}
          transaction={tx({ mode: "redelegate" })}
          field={field}
        />,
      );
      expect(screen.queryByText("Validator")).toBeNull();
    });
  });
});
