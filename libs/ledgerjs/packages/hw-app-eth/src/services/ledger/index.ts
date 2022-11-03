// This implements the resolution of a Transaction using Ledger's own API
import { log } from "@ledgerhq/logs";
import { Interface } from "@ethersproject/abi";

import {
  LedgerEthTransactionResolution,
  LedgerEthTransactionService,
} from "../types";
import { loadInfosForContractMethod } from "./contracts";
import { byContractAddressAndChainId, findERC20SignaturesInfo } from "./erc20";
import { getNFTInfo, loadNftPlugin } from "./nfts";
import { decodeTxInfo } from "../../utils";

const ledgerService: LedgerEthTransactionService = {
  resolveTransaction: async (rawTxHex, loadConfig, resolutionConfig) => {
    const resolution: LedgerEthTransactionResolution = {
      erc20Tokens: [],
      nfts: [],
      externalPlugin: [],
      plugin: [],
    };

    function provideERC20TokenInformation(dataHex: string) {
      resolution.erc20Tokens.push(dataHex);
    }
    function provideNFTInformation(dataHex: string) {
      resolution.nfts.push(dataHex);
    }
    function setExternalPlugin(payload: string, signature: string) {
      resolution.externalPlugin.push({ payload, signature });
    }
    function setPlugin(dataHex: string) {
      resolution.plugin.push(dataHex);
    }

    const rawTx = Buffer.from(rawTxHex, "hex");
    const { decodedTx, chainIdTruncated } = decodeTxInfo(rawTx);
    const provideForContract = async (address) => {
      const nftInfo = resolutionConfig.nft
        ? await getNFTInfo(address, chainIdTruncated, loadConfig)
        : null;
      if (nftInfo) {
        log(
          "ethereum",
          "loaded nft info for " +
            nftInfo.contractAddress +
            " (" +
            nftInfo.collectionName +
            ")"
        );
        provideNFTInformation(nftInfo.data);
      } else {
        const erc20SignaturesBlob = await findERC20SignaturesInfo(loadConfig);

        const erc20Info = byContractAddressAndChainId(
          address,
          chainIdTruncated,
          erc20SignaturesBlob
        );
        if (erc20Info) {
          log(
            "ethereum",
            "loaded erc20token info for " +
              erc20Info.contractAddress +
              " (" +
              erc20Info.ticker +
              ")"
          );
          provideERC20TokenInformation(erc20Info.data.toString("hex"));
        }
      }
    };

    if (decodedTx.data.length >= 10) {
      const selector = decodedTx.data.substring(0, 10);
      const nftPluginPayload = resolutionConfig.nft
        ? await loadNftPlugin(
            decodedTx.to,
            selector,
            chainIdTruncated,
            loadConfig
          )
        : null;

      if (nftPluginPayload) {
        setPlugin(nftPluginPayload);
      } else {
        const infos = resolutionConfig.externalPlugins
          ? await loadInfosForContractMethod(
              decodedTx.to,
              selector,
              chainIdTruncated,
              loadConfig
            )
          : null;

        if (infos) {
          const { plugin, payload, signature, erc20OfInterest, abi } = infos;

          if (plugin) {
            log("ethereum", "found plugin for " + selector);
            setExternalPlugin(payload, signature);
          }
          if (erc20OfInterest && erc20OfInterest.length && abi) {
            const contract = new Interface(abi);
            const args = contract.parseTransaction(decodedTx).args;
            for (const path of erc20OfInterest) {
              const address = path.split(".").reduce((value, seg) => {
                if (seg === "-1" && Array.isArray(value)) {
                  return value[value.length - 1];
                }
                return value[seg];
              }, args);
              await provideForContract(address);
            }
          }
        } else {
          log("ethereum", "no infos for selector " + selector);
        }
      }
      await provideForContract(decodedTx.to);
    }

    return resolution;
  },
};

export default ledgerService;
