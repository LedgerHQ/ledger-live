import { CryptoCurrency } from "@ledgerhq/cryptoassets";
import Client, { Network, Validator } from "@helium/http";

const MAX = 100;
const userAgent = `helium-ledger-live-js-client`;

export const getValidators = async (
  currency: CryptoCurrency,
  address?: string
): Promise<Validator[]> => {
  const client = new Client(
    currency.id === "helium_testnet" ? Network.testnet : Network.production,
    {
      retry: 1,
      name: userAgent,
      userAgent,
    }
  );

  let allValidatorsList;

  if (address !== undefined) {
    allValidatorsList = await client.account(address).validators.list();
  } else {
    allValidatorsList = await client.validators.list();
  }

  return allValidatorsList.takeJSON(MAX);
};
