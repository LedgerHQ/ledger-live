import type { AccountLike } from "@ledgerhq/types-live";
import { createAccountListHandler } from "../accountList";
import { getDepsFrom, makeHandlerDeps } from "./testHelpers";
import { createFixtureAccount } from "../../logic/__tests__/testHelpers";
import { createFixtureTokenAccount } from "../../../mock/fixtures/cryptoCurrencies";

jest.mock("../../converters", () => ({
  accountToWalletAPIAccount: jest.fn((_walletState, account) => ({
    id: `wapi:${account.id}`,
  })),
  resolveWalletApiSpendableBalance: jest.fn(),
}));

import { accountToWalletAPIAccount } from "../../converters";

const mockedAccountToWalletAPIAccount = accountToWalletAPIAccount as jest.Mock;

describe("createAccountListHandler", () => {
  beforeEach(() => {
    mockedAccountToWalletAPIAccount.mockClear();
  });

  const ethAccount = createFixtureAccount("eth", {
    ...createFixtureAccount().currency,
    id: "ethereum",
    family: "ethereum",
  });
  const btcAccount = createFixtureAccount("btc", {
    ...createFixtureAccount().currency,
    id: "bitcoin",
    family: "bitcoin",
  });

  it("returns all accounts when manifest.currencies is '*' (-> '**')", async () => {
    const accounts: AccountLike[] = [ethAccount, btcAccount];
    const handler = createAccountListHandler(
      getDepsFrom(
        makeHandlerDeps({
          accounts,
          manifest: { ...makeHandlerDeps().manifest, currencies: "*" },
        }),
      ),
    );

    const result = await handler({});

    expect(result).toHaveLength(2);
    expect(mockedAccountToWalletAPIAccount).toHaveBeenCalledTimes(2);
  });

  it("filters accounts by query currencyIds when manifest allows all", async () => {
    const accounts: AccountLike[] = [ethAccount, btcAccount];
    const handler = createAccountListHandler(
      getDepsFrom(
        makeHandlerDeps({
          accounts,
          manifest: { ...makeHandlerDeps().manifest, currencies: "*" },
        }),
      ),
    );

    const result = await handler({ currencyIds: ["bitcoin"] });

    expect(result).toEqual([{ id: `wapi:${btcAccount.id}` }]);
  });

  it("restricts to manifest.currencies allowlist", async () => {
    const accounts: AccountLike[] = [ethAccount, btcAccount];
    const handler = createAccountListHandler(
      getDepsFrom(
        makeHandlerDeps({
          accounts,
          manifest: { ...makeHandlerDeps().manifest, currencies: ["bitcoin"] },
        }),
      ),
    );

    const result = await handler({});

    expect(result).toEqual([{ id: `wapi:${btcAccount.id}` }]);
  });

  it("intersects manifest allowlist with query currencyIds", async () => {
    const accounts: AccountLike[] = [ethAccount, btcAccount];
    const handler = createAccountListHandler(
      getDepsFrom(
        makeHandlerDeps({
          accounts,
          manifest: {
            ...makeHandlerDeps().manifest,
            currencies: ["bitcoin", "ethereum"],
          },
        }),
      ),
    );

    // query asks for ethereum + an id not in manifest -> only ethereum passes
    const result = await handler({ currencyIds: ["ethereum", "polkadot"] });

    expect(result).toEqual([{ id: `wapi:${ethAccount.id}` }]);
  });

  it("supports token family wildcards (ethereum/**) for token accounts", async () => {
    // createFixtureTokenAccount("tok") has parentId "js:2:ethereum:0x0tok:"; the parent
    // account must be present in `accounts` for getParentAccount to resolve it.
    const tokenAccount = createFixtureTokenAccount("tok"); // parentCurrencyId: ethereum
    const parent = createFixtureAccount("tok");
    const accounts: AccountLike[] = [parent, tokenAccount, btcAccount];
    const handler = createAccountListHandler(
      getDepsFrom(
        makeHandlerDeps({
          accounts,
          manifest: {
            ...makeHandlerDeps().manifest,
            currencies: ["ethereum/**"],
          },
        }),
      ),
    );

    const result = await handler({});

    // A token-family wildcard matches on parentCurrencyId, so both the ethereum token
    // account and its plain ethereum parent qualify; the unrelated btc account does not.
    expect(result).toEqual(
      expect.arrayContaining([{ id: `wapi:${tokenAccount.id}` }, { id: `wapi:${parent.id}` }]),
    );
    expect(result).toHaveLength(2);
  });

  it("filters token family wildcard down to the queried token ids", async () => {
    const tokenAccount = createFixtureTokenAccount("tok");
    const parent = createFixtureAccount("tok");
    const accounts: AccountLike[] = [parent, tokenAccount];
    const handler = createAccountListHandler(
      getDepsFrom(
        makeHandlerDeps({
          accounts,
          manifest: {
            ...makeHandlerDeps().manifest,
            currencies: ["ethereum/**"],
          },
        }),
      ),
    );

    // query a token id that startsWith "ethereum/" -> kept
    const kept = await handler({ currencyIds: [tokenAccount.token.id] });
    expect(kept).toEqual([{ id: `wapi:${tokenAccount.id}` }]);

    // query a token id outside the family -> filtered out
    const dropped = await handler({ currencyIds: ["polkadot/asset/1"] });
    expect(dropped).toHaveLength(0);
  });

  it("returns an empty list when no account matches", async () => {
    const accounts: AccountLike[] = [ethAccount];
    const handler = createAccountListHandler(
      getDepsFrom(
        makeHandlerDeps({
          accounts,
          manifest: { ...makeHandlerDeps().manifest, currencies: ["bitcoin"] },
        }),
      ),
    );

    expect(await handler({})).toEqual([]);
  });
});
