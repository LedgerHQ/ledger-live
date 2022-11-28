import { getCryptoCurrencyById } from "../../currencies";
import { CosmosValidatorsManager } from "./CosmosValidatorsManager";

const cosmosValidatorsManager = new CosmosValidatorsManager(
  getCryptoCurrencyById("cosmos")
);

export default cosmosValidatorsManager;
