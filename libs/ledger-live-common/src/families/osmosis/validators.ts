import { getCryptoCurrencyById } from "../../currencies";
import { CosmosValidatorsManager } from "../cosmos/CosmosValidatorsManager";
import { nodeEndpoint } from "./api/sdk";

const osmosisValidatorsManager = new CosmosValidatorsManager(
  getCryptoCurrencyById("osmo"),
  {
    endPoint: nodeEndpoint,
  }
);

export default osmosisValidatorsManager;
