import network from "@ledgerhq/live-network";

export type ValidatorApi = {
  fetchValidators: (config: { baseUrl: string; validatorsEndpoint: string }) => Promise<string[]>;
};

type CosmosValidator = { operator_address: string };
type CosmosValidatorsResponse = { validators: CosmosValidator[] };

const seiValidatorApi: ValidatorApi = {
  fetchValidators: async config => {
    const { baseUrl, validatorsEndpoint } = config;
    if (!baseUrl) return [];

    try {
      const { data } = await network<CosmosValidatorsResponse>({
        url: `${baseUrl}${validatorsEndpoint}`,
        method: "GET",
      });

      return Array.isArray(data?.validators)
        ? data.validators
            .map(v => v?.operator_address)
            .filter((addr): addr is string => typeof addr === "string")
        : [];
    } catch (error) {
      // graceful
      console.error("Failed to fetch SEI validators", {
        error: error instanceof Error ? error.message : String(error),
        baseUrl,
      });
      return [];
    }
  },
};

export const getValidatorApi = (currencyId: string): ValidatorApi | undefined => {
  switch (currencyId) {
    case "sei_evm":
      return seiValidatorApi;
    default:
      return undefined;
  }
};

export const getValidators = async (
  currencyId: string,
  apiConfig?: { baseUrl: string; validatorsEndpoint: string },
): Promise<string[]> => {
  const api = getValidatorApi(currencyId);
  return api && apiConfig ? api.fetchValidators(apiConfig) : [];
};
