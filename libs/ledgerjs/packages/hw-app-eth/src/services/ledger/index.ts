import { parse as parseTransaction } from "@ethersproject/transactions";
import { Interface } from "@ethersproject/abi";
import { log } from "@ledgerhq/logs";
import {
  signDomainResolution,
  signAddressResolution,
} from "@ledgerhq/domain-service/signers/index";
import { LedgerEthTransactionResolution, LedgerEthTransactionService, LoadConfig } from "../types";
import { UNISWAP_UNIVERSAL_ROUTER_ADDRESS } from "../../modules/Uniswap/constants";
import { byContractAddressAndChainId, findERC20SignaturesInfo } from "./erc20";
import { loadInfosForUniswap } from "../../modules/Uniswap";
import { loadInfosForContractMethod } from "./contracts";
import { getNFTInfo, loadNftPlugin } from "./nfts";
import {
  tokenSelectors,
  nftSelectors,
  mergeResolutions,
  ERC20_CLEAR_SIGNED_SELECTORS,
  ERC1155_CLEAR_SIGNED_SELECTORS,
  ERC721_CLEAR_SIGNED_SELECTORS,
  getChainIdAsUint32,
} from "../../utils";

type PotentialResolutions = {
  token: boolean | undefined;
  nft: boolean | undefined;
  externalPlugins: boolean | undefined;
  uniswapV3: boolean | undefined;
};

/**
 * @ignore for external documentation
 *
 * Providing additionnal data for some transactions (Token or NFT related) can enable clear signing
 * of initially impossible to decode data.
 * This method will add necessary APDUs to the resolution paramter in order to provide this data to the nano app
 */
const getAdditionalDataForContract = async (
  contractAddress: string,
  chainIdUint32: number,
  loadConfig: LoadConfig,
  shouldResolve: PotentialResolutions,
): Promise<Pick<LedgerEthTransactionResolution, "nfts" | "erc20Tokens">> => {
  const resolution: Pick<LedgerEthTransactionResolution, "nfts" | "erc20Tokens"> = {
    nfts: [],
    erc20Tokens: [],
  };

  if (shouldResolve.nft) {
    const nftInfo = await getNFTInfo(contractAddress, chainIdUint32, loadConfig);

    if (nftInfo) {
      log(
        "ethereum",
        "loaded nft info for " + nftInfo.contractAddress + " (" + nftInfo.collectionName + ")",
      );
      resolution.nfts.push(nftInfo.data);
    } else {
      log("ethereum", "couldn't load nft info for " + contractAddress);
    }
  }

  if (shouldResolve.token) {
    const erc20SignaturesBlob = await findERC20SignaturesInfo(loadConfig, chainIdUint32);
    const erc20Info = byContractAddressAndChainId(
      contractAddress,
      chainIdUint32,
      erc20SignaturesBlob,
    );

    if (erc20Info) {
      log(
        "ethereum",
        "loaded erc20token info for " + erc20Info.contractAddress + " (" + erc20Info.ticker + ")",
      );
      resolution.erc20Tokens.push(erc20Info.data.toString("hex"));
    } else {
      log("ethereum", "couldn't load erc20token info for " + contractAddress);
    }
  }

  return resolution;
};

/**
 * @ignore for external documentation
 *
 * Depending on the transaction, it might be necessary to load internal plugins in the nano app
 * in order to clear sign it.
 * This method will add necessary APDUs to the resolution parameter in order to load those internal plugins
 */
const loadNanoAppPlugins = async (
  contractAddress: string,
  selector: string,
  parsedTransaction,
  chainIdUint32: number,
  loadConfig: LoadConfig,
  shouldResolve: PotentialResolutions,
): Promise<LedgerEthTransactionResolution> => {
  let resolution: LedgerEthTransactionResolution = {
    externalPlugin: [],
    plugin: [],
    nfts: [],
    erc20Tokens: [],
    domains: [],
  };

  if (shouldResolve.nft) {
    const nftPluginPayload = await loadNftPlugin(
      contractAddress,
      selector,
      chainIdUint32,
      loadConfig,
    );

    if (nftPluginPayload) {
      resolution.plugin.push(nftPluginPayload);
    } else {
      log(
        "ethereum",
        "no NFT plugin payload for selector " + selector + " and address " + contractAddress,
      );
    }
  }

  // Uniswap has its own way of working, so we need to handle it separately
  // This will prevent an error if we add Uniswap to the CAL service
  if (shouldResolve.externalPlugins && contractAddress !== UNISWAP_UNIVERSAL_ROUTER_ADDRESS) {
    const contractMethodInfos = await loadInfosForContractMethod(
      contractAddress,
      selector,
      chainIdUint32,
      loadConfig,
    );

    if (contractMethodInfos) {
      const { plugin, payload, signature, erc20OfInterest, abi } = contractMethodInfos;

      if (plugin) {
        log("ethereum", `found plugin (${plugin}) for selector: ${selector}`);
        resolution.externalPlugin.push({ payload, signature });
      }

      if (erc20OfInterest && erc20OfInterest.length && abi) {
        const contract = new Interface(abi);
        const args = contract.parseTransaction(parsedTransaction).args;

        for (const path of erc20OfInterest) {
          const erc20ContractAddress = path.split(".").reduce((value, seg) => {
            if (seg === "-1" && Array.isArray(value)) {
              return value[value.length - 1];
            }
            return value[seg];
          }, args) as unknown as string; // impossible(?) to type correctly as the initializer is different from the returned type

          const externalPluginResolution = await getAdditionalDataForContract(
            erc20ContractAddress,
            chainIdUint32,
            loadConfig,
            {
              nft: false,
              externalPlugins: false,
              token: true, // enforcing resolution of tokens for external plugins that need info on assets (e.g. for a swap)
              uniswapV3: false,
            },
          );
          resolution = mergeResolutions([resolution, externalPluginResolution]);
        }
      }
    } else {
      log("ethereum", "no infos for selector " + selector);
    }
  }

  if (shouldResolve.uniswapV3) {
    const { pluginData, tokenDescriptors } = await loadInfosForUniswap(
      parsedTransaction,
      chainIdUint32,
    );
    if (pluginData && tokenDescriptors) {
      resolution.externalPlugin.push({
        payload: pluginData.toString("hex"),
        signature: "",
      });
      resolution.erc20Tokens.push(...tokenDescriptors.map(d => d.toString("hex")));
    }
  }

  return resolution;
};

/**
 * @ignore for external documentation
 *
 * In charge of collecting the different APDUs necessary for clear signing
 * a transaction based on a specified configuration.
 */
const resolveTransaction: LedgerEthTransactionService["resolveTransaction"] = async (
  rawTxHex,
  loadConfig,
  resolutionConfig,
) => {
  const rawTx = Buffer.from(rawTxHex, "hex");
  const parsedTransaction = parseTransaction(`0x${rawTx.toString("hex")}`);
  const chainIdUint32 = getChainIdAsUint32(parsedTransaction.chainId);
  const { domains } = resolutionConfig;

  const contractAddress = parsedTransaction.to?.toLowerCase();
  if (!contractAddress)
    return {
      nfts: [],
      erc20Tokens: [],
      externalPlugin: [],
      plugin: [],
      domains: [],
    };

  const selector = parsedTransaction.data.length >= 10 && parsedTransaction.data.substring(0, 10);

  const resolutions: Partial<LedgerEthTransactionResolution>[] = [];
  if (selector) {
    const shouldResolve: PotentialResolutions = {
      token:
        resolutionConfig.erc20 && tokenSelectors.includes(selector as ERC20_CLEAR_SIGNED_SELECTORS),
      nft:
        resolutionConfig.nft &&
        nftSelectors.includes(
          selector as ERC721_CLEAR_SIGNED_SELECTORS | ERC1155_CLEAR_SIGNED_SELECTORS,
        ),
      externalPlugins: resolutionConfig.externalPlugins,
      uniswapV3: resolutionConfig.uniswapV3,
    };

    const pluginsResolution = await loadNanoAppPlugins(
      contractAddress,
      selector,
      parsedTransaction,
      chainIdUint32,
      loadConfig,
      shouldResolve,
    );
    if (pluginsResolution) {
      resolutions.push(pluginsResolution);
    }

    const contractResolution = await getAdditionalDataForContract(
      contractAddress,
      chainIdUint32,
      loadConfig,
      shouldResolve,
    );
    if (contractResolution) {
      resolutions.push(contractResolution);
    }
  }

  // Passthrough to be accessible to the Domains module
  if (domains) {
    const domainResolutions: Partial<LedgerEthTransactionResolution> = {
      domains,
    };
    resolutions.push(domainResolutions);
  }

  return mergeResolutions(resolutions);
};

export default {
  resolveTransaction,
  signDomainResolution,
  signAddressResolution,
} as LedgerEthTransactionService;
