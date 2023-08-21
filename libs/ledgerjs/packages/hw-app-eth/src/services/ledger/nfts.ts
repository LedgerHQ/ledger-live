import axios from "axios";
import { getLoadConfig } from "./loadConfig";
import type { LoadConfig } from "../types";
import { log } from "@ledgerhq/logs";

type NftInfo = {
  contractAddress: string;
  collectionName: string;
  data: string;
};

type BackendResponse = {
  payload: string;
};

export const getNFTInfo = async (
  contractAddress: string,
  chainId: number,
  userLoadConfig: LoadConfig,
): Promise<NftInfo | undefined> => {
  const { nftExplorerBaseURL } = getLoadConfig(userLoadConfig);
  if (!nftExplorerBaseURL) return;
  const url = `${nftExplorerBaseURL}/${chainId}/contracts/${contractAddress}`;
  const response = await axios
    .get<BackendResponse>(url)
    .then(r => r.data)
    .catch(e => {
      log("error", "could not fetch from " + url + ": " + String(e));
      return null;
    });
  if (!response) return;

  // APDU response specification: https://ledgerhq.atlassian.net/wiki/spaces/WALLETCO/pages/3269984297/NFT-1+NFT+Backend+design#NFT-Metadata-BLOB
  const payload = response["payload"];
  // Collection name length position: 3rd byte -> caracter 4 to 6
  const collectionNameLength = parseInt(payload.slice(4, 6), 16);
  const collectionNameHex = payload.substr(6, collectionNameLength * 2);
  const collectionName = collectionNameHex
    .match(/.{2}/g) // split every 2 characters
    ?.reduce((acc, curr) => (acc += String.fromCharCode(parseInt(curr, 16))), ""); // convert hex to string

  return {
    contractAddress: contractAddress,
    collectionName: collectionName || "",
    data: payload,
  };
};

export const loadNftPlugin = async (
  contractAddress: string,
  selector: string,
  chainId: number,
  userLoadConfig: LoadConfig,
): Promise<string | undefined> => {
  const { nftExplorerBaseURL } = getLoadConfig(userLoadConfig);
  if (!nftExplorerBaseURL) return;
  const url = `${nftExplorerBaseURL}/${chainId}/contracts/${contractAddress}/plugin-selector/${selector}`;

  const response = await axios
    .get<BackendResponse>(url)
    .then(r => r.data)
    .catch(e => {
      log("error", "could not fetch from " + url + ": " + String(e));
      return null;
    });
  if (!response) return;

  const payload = response["payload"];
  return payload;
};
