import cosmosResolver from "@ledgerhq/coin-cosmos/hw-getAddress";
import cryptoFactory from "@ledgerhq/coin-cosmos/chain/chain";
import { openTransportReplayer, RecordStore } from "@ledgerhq/hw-transport-mocker";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { DEVICE_CHAINS } from "./fixtures/deviceApdus";
import { createSigner } from "./setup";

const DEVICE_ACCOUNTS = DEVICE_CHAINS.flatMap(({ currencyId, accounts }) =>
  accounts.map(account => ({ currencyId, ...account })),
);

const openSigner = async (apdus: string) => {
  const transport = await openTransportReplayer(RecordStore.fromString(apdus));
  return createSigner(transport);
};

describe("cosmos setup createSigner on recorded device exchanges", () => {
  it.each(DEVICE_ACCOUNTS)(
    "reads the public key and address of $currencyId at $path",
    async ({ currencyId, path, apdus, publicKey, address }) => {
      const signer = await openSigner(apdus);

      const result = await signer.getAddress(path, cryptoFactory(currencyId).prefix, false);

      expect(result).toEqual({ publicKey, address });
    },
  );

  it.each(DEVICE_ACCOUNTS)(
    "resolves the address, the public key and the path of $currencyId at $path",
    async ({ currencyId, path, apdus, publicKey, address }) => {
      const signer = await openSigner(apdus);
      const resolve = cosmosResolver((_deviceId, job) => job(signer));

      const result = await resolve("device", {
        currency: getCryptoCurrencyById(currencyId),
        path,
        derivationMode: "",
      });

      expect(result).toEqual({ address, publicKey, path });
    },
  );
});
