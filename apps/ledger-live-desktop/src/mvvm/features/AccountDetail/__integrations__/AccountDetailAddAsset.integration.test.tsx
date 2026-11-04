import React from "react";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { Account } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { render, screen } from "tests/testSetup";
import { importLLDCoinFamily } from "~/renderer/families";
import { getModalData, isModalOpened } from "~/renderer/reducers/modals";
import { AssetsSectionHeader } from "../components/AssetsSection/AssetsSectionHeader";

const accountOf = (currencyId: string): Account =>
  genAccount(`add-asset-${currencyId}`, { currency: getCryptoCurrencyById(currencyId) });

const FAMILIES_WITH_OWN_FLOW = [
  { currencyId: "algorand", modalName: "MODAL_ALGORAND_OPT_IN" },
  { currencyId: "stellar", modalName: "MODAL_STELLAR_ADD_ASSET" },
  { currencyId: "hedera", modalName: "MODAL_HEDERA_RECEIVE_WITH_ASSOCIATION" },
] as const;
const FAMILIES_WITHOUT = ["ethereum", "bitcoin"];

beforeAll(async () => {
  await Promise.all(
    [...FAMILIES_WITH_OWN_FLOW.map(({ currencyId }) => currencyId), ...FAMILIES_WITHOUT].map(
      currencyId => importLLDCoinFamily(getCryptoCurrencyById(currencyId).family),
    ),
  );
});

describe("Account Detail assets header", () => {
  it.each(FAMILIES_WITH_OWN_FLOW)(
    "offers to add an asset on $currencyId and opens its own flow",
    async ({ currencyId, modalName }) => {
      const account = accountOf(currencyId);
      const { store, user } = render(<AssetsSectionHeader account={account} />);

      expect(await screen.findByText("Assets")).toBeInTheDocument();
      await user.click(await screen.findByText("Add"));

      expect(isModalOpened(store.getState(), modalName)).toBe(true);
      expect(isModalOpened(store.getState(), "MODAL_RECEIVE")).toBe(false);
      expect(getModalData(store.getState(), modalName)).toMatchObject({ account });
    },
  );

  it.each(FAMILIES_WITHOUT)(
    "only shows the title on %s, even when it has tokens",
    async currencyId => {
      render(<AssetsSectionHeader account={accountOf(currencyId)} />);

      expect(await screen.findByText("Assets")).toBeInTheDocument();
      expect(screen.queryByText("Add")).toBeNull();
    },
  );
});
