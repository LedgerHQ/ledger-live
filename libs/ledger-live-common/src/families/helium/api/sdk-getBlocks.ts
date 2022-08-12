import { CryptoCurrency } from "@ledgerhq/cryptoassets";
import Client, { Network } from "@helium/http";

const userAgent = `helium-ledger-live-js-client`;

export const getBlocks = async (currency: CryptoCurrency): Promise<number> => {
  const client = new Client(
    // TODO: Switch to testnet when we have vote data for testnet
    currency.id === "helium_testnet" ? Network.production : Network.production,
    {
      retry: 1,
      name: userAgent,
      userAgent,
    }
  );

  return await client.blocks.getHeight();
};
