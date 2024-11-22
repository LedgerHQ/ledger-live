import { getEnv } from "@ledgerhq/live-env";
import network from "@ledgerhq/live-network";

const CAL_BASE_URL = getEnv("CAL_SERVICE_URL");

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
): Promise<CurrencyData> {
  const { data: currencyData } = await network<CurrencyDataResponse[]>({
    method: "GET",
    url: `${CAL_BASE_URL}/v1/currencies`,
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
    signature: currencyData[0].descriptor_exchange_app.signatures[env],
  };
}
