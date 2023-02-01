import { blockchainBaseURL } from "../api/Ledger";
import { getCryptoCurrencyById } from "../currencies";
import network from "../network";

export const getAddressByName = async (name: string): Promise<string> => {
  const currency = getCryptoCurrencyById("ethereum");
  const url = `${blockchainBaseURL(currency)}/ens/resolve/${name}`;
  const address = (await network({ method: "GET", url })).data;

  return address;
};
