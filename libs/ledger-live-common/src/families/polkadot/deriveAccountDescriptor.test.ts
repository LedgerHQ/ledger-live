import { lastValueFrom } from "rxjs";
import { CryptoCurrencyIdSchema } from "@domain/entity-currency-crypto";
import { candidateOf } from "@domain/entity-derivation";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import Transport from "@ledgerhq/hw-transport";
import { networkFromCurrencyId } from "@domain/entity-network";
import type { RunOnTransport } from "../../coin-modules/types";
import { deriveAccountDescriptor } from "./setup";

const mockAddress = "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5";
jest.mock("@ledgerhq/coin-polkadot/signer/index", () => ({
  __esModule: true,
  default:
    () =>
    async (_: string, { path }: { path: string }) => ({
      address: mockAddress,
      publicKey: "",
      path,
    }),
}));
const mockAssetHubConfig = { hasBeenMigrated: false };
jest.mock("../../config", () => ({
  ...jest.requireActual("../../config"),
  getCurrencyConfiguration: () => mockAssetHubConfig,
}));

const network = (id: string) => networkFromCurrencyId(CryptoCurrencyIdSchema.parse(id));
const candidate = (id: string) => candidateOf(getCryptoCurrencyById(id), "polkadotbip44", 0);
const transport: Transport = Object.create(Transport.prototype);
const runOnTransport: RunOnTransport = job => job(transport, new AbortController().signal);

const derive = (id: string) =>
  lastValueFrom(deriveAccountDescriptor(runOnTransport, getCryptoCurrencyById(id), candidate(id)));

describe("deriveAccountDescriptor (Polkadot)", () => {
  it("names a Polkadot account on Asset Hub once Polkadot migrated there, as the sync does", async () => {
    mockAssetHubConfig.hasBeenMigrated = true;
    await expect(derive("polkadot")).resolves.toMatchObject({
      type: "address",
      network: network("assethub_polkadot"),
      key: mockAddress,
      path: candidate("polkadot").addressPath,
    });
  });

  it("keeps the Polkadot network before the migration", async () => {
    mockAssetHubConfig.hasBeenMigrated = false;
    await expect(derive("polkadot")).resolves.toMatchObject({ network: network("polkadot") });
  });

  it("keeps an Asset Hub candidate on Asset Hub", async () => {
    mockAssetHubConfig.hasBeenMigrated = true;
    await expect(derive("assethub_polkadot")).resolves.toMatchObject({
      network: network("assethub_polkadot"),
    });
  });
});
