import { UtxoAccountNotSyncedError } from "@ledgerhq/account-module-utxo";
import * as coinFrameworkErrors from "@ledgerhq/coin-module-framework/errors";
import * as walletFrameworkErrors from "@ledgerhq/ledger-wallet-framework/errors";
import * as sanctionErrors from "@ledgerhq/ledger-wallet-framework/sanction/errors";
import { NetworkDown } from "@ledgerhq/live-network/errors";
import { PortfolioApiError } from "@ledgerhq/portfolio-module-framework";
import * as bitcoinErrors from "@ledgerhq/coin-bitcoin/errors";
import * as cantonErrors from "@ledgerhq/coin-canton/errors";
import * as cantonTypeErrors from "@ledgerhq/coin-canton/types/errors";
import * as cardanoErrors from "@ledgerhq/coin-cardano/errors";
import * as casperErrors from "@ledgerhq/coin-casper/errors";
import * as celoErrors from "@ledgerhq/coin-celo/errors";
import * as cosmosErrors from "@ledgerhq/coin-cosmos/errors";
import * as evmErrors from "@ledgerhq/coin-evm/errors";
import * as hederaErrors from "@ledgerhq/coin-hedera/errors";
import * as kaspaErrors from "@ledgerhq/coin-kaspa/errors";
import * as kaspaTypeErrors from "@ledgerhq/coin-kaspa/types/errors";
import * as multiversxErrors from "@ledgerhq/coin-multiversx/errors";
import * as nearErrors from "@ledgerhq/coin-near/errors";
import * as solanaErrors from "@ledgerhq/coin-solana/errors";
import * as stacksErrors from "@ledgerhq/coin-stacks/errors";
import * as stellarErrors from "@ledgerhq/coin-stellar/errors";
import * as tezosErrors from "@ledgerhq/coin-tezos/errors";
import * as tronErrors from "@ledgerhq/coin-tron/types/errors";
import * as vechainErrors from "@ledgerhq/coin-vechain/errors";
import * as xrpTypes from "@ledgerhq/coin-xrp/types";
import { coinModuleLoaders } from "../../../coin-modules/loaders";
import * as liveCommonErrors from "../../../errors";
import {
  errorClassesOf,
  errorRegistry,
  FAMILY_ERROR_MODULES,
  SHARED_ERROR_MODULES,
  type ErrorModule,
} from "./errorClasses";
import { reviveError } from "./errors";

/** The modules the registry must cover: Ledger Wallet's, the frameworks', each generic coin module's. */
const LISTED_MODULES: Record<string, ErrorModule> = {
  "@ledgerhq/ledger-wallet-framework/errors": walletFrameworkErrors,
  "@ledgerhq/ledger-wallet-framework/sanction/errors": sanctionErrors,
  "@ledgerhq/coin-module-framework/errors": coinFrameworkErrors,
  "@ledgerhq/portfolio-module-framework": { PortfolioApiError },
  "@ledgerhq/account-module-utxo": { UtxoAccountNotSyncedError },
  "@ledgerhq/live-common/errors": liveCommonErrors,
  "@ledgerhq/coin-bitcoin/errors": bitcoinErrors,
  "@ledgerhq/coin-canton/errors": cantonErrors,
  "@ledgerhq/coin-canton/types/errors": cantonTypeErrors,
  "@ledgerhq/coin-cardano/errors": cardanoErrors,
  "@ledgerhq/coin-casper/errors": casperErrors,
  "@ledgerhq/coin-celo/errors": celoErrors,
  "@ledgerhq/coin-cosmos/errors": cosmosErrors,
  "@ledgerhq/coin-evm/errors": evmErrors,
  "@ledgerhq/coin-hedera/errors": hederaErrors,
  "@ledgerhq/coin-kaspa/errors": kaspaErrors,
  "@ledgerhq/coin-kaspa/types/errors": kaspaTypeErrors,
  "@ledgerhq/coin-multiversx/errors": multiversxErrors,
  "@ledgerhq/coin-near/errors": nearErrors,
  "@ledgerhq/coin-solana/errors": solanaErrors,
  "@ledgerhq/coin-stacks/errors": stacksErrors,
  "@ledgerhq/coin-stellar/errors": stellarErrors,
  "@ledgerhq/coin-tezos/errors": tezosErrors,
  "@ledgerhq/coin-tron/types/errors": tronErrors,
  "@ledgerhq/coin-vechain/errors": vechainErrors,
  "@ledgerhq/coin-xrp/types": xrpTypes,
};

const isErrorClass = (value: unknown): value is new () => Error =>
  typeof value === "function" && value.prototype instanceof Error;

describe("errorClassesOf", () => {
  it("names each class of a module by the name its instances carry", () => {
    const classes = errorClassesOf(bitcoinErrors);
    expect(classes.get("InfrastructureError")).toBe(bitcoinErrors.BitcoinInfrastructureError);
    expect(classes.has("BitcoinInfrastructureError")).toBe(false);
  });

  it("keeps the first export of a name, leaves out what is not an error class", () => {
    class First extends Error {
      override name = "Shared";
    }
    class Second extends Error {
      override name = "Shared";
    }
    const classes = errorClassesOf({ First, Second, value: 1, fn: () => undefined, obj: {} });
    expect([...classes]).toEqual([["Shared", First]]);
  });

  it("names a class it cannot build bare by its export, and leaves out one named Error", () => {
    class NeedsArguments extends Error {
      constructor(required: { message: string }) {
        super(required.message);
        this.name = "Required";
      }
    }
    class Unnamed extends Error {}
    expect([...errorClassesOf({ NeedsArguments, Unnamed })]).toEqual([
      ["NeedsArguments", NeedsArguments],
    ]);
  });
});

describe("errorRegistry", () => {
  it("registers every error class the listed modules export, under the name it carries", () => {
    const families = [undefined, ...FAMILY_ERROR_MODULES.keys()];
    const missing: string[] = [];
    for (const [path, module] of Object.entries(LISTED_MODULES)) {
      for (const [exportName, value] of Object.entries(module)) {
        if (!isErrorClass(value)) continue;
        const { name } = new value();
        if (!families.some(family => errorRegistry(family).get(name) === value)) {
          missing.push(`${path} ${exportName}`);
        }
      }
    }
    // Ledger Wallet's own copies of names the wallet framework declares: no module the portfolio
    // layer runs can throw them (none imports Ledger Wallet), a view of that name is the framework's.
    expect(missing).toEqual(
      [
        "AccountNotSupported",
        "DeviceAppVerifyNotSupported",
        "InvalidParameterError",
        "NotEnoughGas",
        "UpdateYourApp",
        "UserRefusedAddress",
      ].map(name => `@ledgerhq/live-common/errors ${name}`),
    );
    expect(errorRegistry().get("AccountNotSupported")).toBe(
      walletFrameworkErrors.AccountNotSupported,
    );
    expect(errorRegistry().get("UserRefusedAddress")).toBe(
      walletFrameworkErrors.UserRefusedAddress,
    );
  });

  it("lists the errors module of every family with a coin module of its own", () => {
    const generic = coinModuleLoaders
      .filter(loader => loader.loadLocalApi !== undefined)
      .map(({ family }) => family);
    expect(generic.filter(family => !FAMILY_ERROR_MODULES.has(family))).toEqual([]);
  });

  it("revives a name several modules declare as the class the family's coin module throws", () => {
    // Coin modules importing their errors from the wallet framework.
    expect(errorRegistry("solana").get("NotEnoughBalance")).toBe(
      walletFrameworkErrors.NotEnoughBalance,
    );
    expect(errorRegistry("solana").get("NotEnoughGas")).toBe(solanaErrors.NotEnoughGas);
    // Coin modules importing them from the coin module framework.
    expect(errorRegistry("tron").get("NotEnoughBalance")).toBe(
      coinFrameworkErrors.NotEnoughBalance,
    );
    expect(errorRegistry("tron").get("NotEnoughGas")).toBe(tronErrors.NotEnoughGas);
    expect(errorRegistry("evm").get("NotEnoughGas")).toBe(evmErrors.NotEnoughGas);
    expect(errorRegistry("kaspa").get("MissingCoinConfig")).toBe(kaspaErrors.MissingCoinConfig);
    expect(errorRegistry("cosmos").get("ValAddressRequired")).toBe(cosmosErrors.ValAddressRequired);
    expect(errorRegistry("xrp").get("XrpInvalidMemo")).toBe(xrpTypes.XrpInvalidMemoError);
  });

  it("revives the shared names alike for any family, the wallet framework's first", () => {
    for (const family of [undefined, "unknown", "constructor", "bitcoin"]) {
      const registry = errorRegistry(family);
      expect(registry.get("NotEnoughBalance")).toBe(walletFrameworkErrors.NotEnoughBalance);
      expect(registry.get("UnexpectedGetBalanceError")).toBe(
        coinFrameworkErrors.UnexpectedGetBalanceError,
      );
      expect(registry.get("PortfolioApiError")).toBe(PortfolioApiError);
      expect(registry.get("UtxoAccountNotSyncedError")).toBe(UtxoAccountNotSyncedError);
      expect(registry.get("CurrencyRegionRestrictedError")).toBe(
        liveCommonErrors.CurrencyRegionRestrictedError,
      );
      expect(registry.get("NetworkDown")).toBe(NetworkDown);
      expect(registry.has("Error")).toBe(false);
    }
  });

  it("revives a sanctioned sender of coin-bitcoin's validation as its class, its addresses kept", () => {
    const { AddressesSanctionedError } = sanctionErrors;
    expect(errorRegistry("bitcoin").get("AddressesSanctionedError")).toBe(AddressesSanctionedError);
    // The view the local side answers of `errors.sender` (portfolio-module-local `toErrorView`).
    const revived = reviveError(
      {
        name: "AddressesSanctionedError",
        message: "AddressesSanctionedError",
        addresses: ["bc1bad"],
      },
      "bitcoin",
    );
    expect(revived).toBeInstanceOf(AddressesSanctionedError);
    expect(revived).toMatchObject({ name: "AddressesSanctionedError", addresses: ["bc1bad"] });
  });

  it("lists the wallet framework's errors first among the shared ones, Ledger Wallet's last", () => {
    expect(SHARED_ERROR_MODULES[0]).toBe(walletFrameworkErrors);
    expect(SHARED_ERROR_MODULES.at(-1)).toBe(liveCommonErrors);
  });

  it("builds the registry of a family once", () => {
    expect(errorRegistry("near")).toBe(errorRegistry("near"));
    expect(errorRegistry()).toBe(errorRegistry(undefined));
  });
});
