import network from "@ledgerhq/live-network";

type CosmosValidator = { operator_address: string };
type CosmosValidatorsResponse = { validators: CosmosValidator[] };

const fetchSeiValidators = async (apiConfig?: {
  baseUrl: string;
  validatorsEndpoint: string;
}): Promise<string[]> => {
  const base = apiConfig?.baseUrl;
  if (!base) return [];

  try {
    const { data } = await network<CosmosValidatorsResponse>({
      url: `${base}${apiConfig?.validatorsEndpoint}`,
      method: "GET",
    });

    return Array.isArray(data?.validators)
      ? data.validators
          .map(v => v?.operator_address)
          .filter((addr): addr is string => typeof addr === "string" && addr.length > 0)
      : [];
  } catch (error) {
    // Log error but don't crash - graceful degradation
    console.error("Failed to fetch SEI validators", {
      error: error instanceof Error ? error.message : String(error),
      baseUrl: base,
    });
    return [];
  }
};

export const getValidators = async (
  currencyId: string,
  apiConfig?: { baseUrl: string; validatorsEndpoint: string },
): Promise<string[]> => {
  return currencyId === "sei_network_evm" ? fetchSeiValidators(apiConfig) : [];
};
