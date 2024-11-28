import network from "@ledgerhq/live-network";
import { getCALDomain } from "./common";

type CurrencyDataResponse = {
  id: string;
  descriptor_exchange_app: {
    data: string;
    signatures: {
      prod: string;
      test: string;
    };
  };
};
export type CurrencyData = {
  id: string;
  config: string;
  signature: string;
};

export async function findCurrencyData(
  id: string,
  env: "prod" | "test" = "prod",
  signatureKind: "prod" | "test" = "prod",
): Promise<CurrencyData> {
  const { data: currencyData } = await network<CurrencyDataResponse[]>({
    method: "GET",
    url: `${getCALDomain(env)}/v1/currencies`,
    params: {
      output: "id,descriptor_exchange_app",
      id,
    },
  });
  if (!currencyData.length) {
    throw new Error(`CAL currencies, missing configuration for ${id}`);
  }
  if (currencyData.length !== 1) {
    throw new Error(`CAL currencies, multiple configurations found for ${id}`);
  }

  return {
    id: currencyData[0].id,
    config: currencyData[0].descriptor_exchange_app.data,
    signature: currencyData[0].descriptor_exchange_app.signatures[signatureKind],
  };
}
