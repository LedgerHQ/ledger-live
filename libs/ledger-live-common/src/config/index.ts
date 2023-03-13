import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import network from "../network";

export const fetchCurrencyConfiguration = async (
  currency: CryptoCurrency
): Promise<any> => {
  const { data } = await network({
    method: "GET",
    url: `https://coinconfig-poc-default-rtdb.europe-west1.firebasedatabase.app/config/${currency.family}/${currency.id}.json`,
  });
  return data;
};

export const fetchFamilyConfiguration = async (
  currency: CryptoCurrency
): Promise<any> => {
  const { data } = await network({
    method: "GET",
    url: `https://coinconfig-poc-default-rtdb.europe-west1.firebasedatabase.app/config/${currency.family}.json`,
  });
  return data;
};
