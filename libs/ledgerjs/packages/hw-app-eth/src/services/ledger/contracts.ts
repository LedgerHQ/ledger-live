import axios from "axios";
import { getLoadConfig } from "./loadConfig";
import type { LoadConfig } from "../types";
import { log } from "@ledgerhq/logs";

type ContractMethod = {
  payload: string;
  signature: string;
  plugin: string;
  erc20OfInterest: string[];
  abi: any;
};

/**
 * Retrieve the metadatas a given contract address and a method selector
 */
export const loadInfosForContractMethod = async (
  contractAddress: string,
  selector: string,
  chainId: number,
  userLoadConfig: LoadConfig
): Promise<ContractMethod | undefined> => {
  const { pluginBaseURL, extraPlugins } = getLoadConfig(userLoadConfig);

  let data = {};

  if (pluginBaseURL) {
    const url = `${pluginBaseURL}/plugins/ethereum.json`;
    data = await axios
      .get(`${pluginBaseURL}/plugins/ethereum.json`)
      .then((r) => r.data as any)
      .catch((e) => {
        log("error", "could not fetch from " + url + ": " + String(e));
        return null;
      });
  }

  if (extraPlugins) {
    data = { ...data, ...extraPlugins };
  }

  if (!data) return;

  const lcSelector = selector.toLowerCase();
  const lcContractAddress = contractAddress.toLowerCase();

  if (lcContractAddress in data) {
    const contractSelectors = data[lcContractAddress];

    if (lcSelector in contractSelectors) {
      return {
        payload: contractSelectors[lcSelector]["serialized_data"],
        signature: contractSelectors[lcSelector]["signature"],
        plugin: contractSelectors[lcSelector]["plugin"],
        erc20OfInterest: contractSelectors[lcSelector]["erc20OfInterest"],
        abi: contractSelectors["abi"],
      };
    }
  }
};
