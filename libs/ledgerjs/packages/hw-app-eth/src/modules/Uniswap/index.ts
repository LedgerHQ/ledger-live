import { log } from "@ledgerhq/logs";
import { Interface } from "@ethersproject/abi";
import type { Transaction } from "@ethersproject/transactions";
import { byContractAddressAndChainId, findERC20SignaturesInfo } from "../../services/ledger/erc20";
import { LoadConfig } from "../../services/types";
import { UniswapDecoders } from "./decoders";
import { CommandsAndTokens } from "./types";
import {
  SWAP_COMMANDS,
  UNISWAP_EXECUTE_SELECTOR,
  UNISWAP_UNIVERSAL_ROUTER_ADDRESS,
  UNISWAP_COMMANDS,
} from "./constants";

/**
 * @ignore for external documentation
 *
 * Indicates if the given calldata is supported by the Uniswap plugin
 * applying some basic checks and testing some assumptions
 * specific to the Uniswap plugin internals
 *
 * @param {`0x${string}`} calldata
 * @param {string | undefined} to
 * @param {number} chainId
 * @param {CommandsAndTokens} commandsAndTokens
 * @returns {boolean}
 */
export const isSupported = (
  calldata: `0x${string}`,
  to: string | undefined,
  chainId: number,
  commandsAndTokens: CommandsAndTokens,
): boolean => {
  const selector = calldata.slice(0, 10);
  const contractAddress = to?.toLowerCase();
  if (
    selector !== UNISWAP_EXECUTE_SELECTOR ||
    contractAddress !== UNISWAP_UNIVERSAL_ROUTER_ADDRESS ||
    !commandsAndTokens.length
  ) {
    return false;
  }

  let endingAsset;
  for (let i = 0; i < commandsAndTokens.length; i++) {
    const [command, tokens] = commandsAndTokens[i];

    if (!command) return false;
    if (!SWAP_COMMANDS.includes(command)) continue;

    const poolVersion = command.slice(0, 2) as "V2" | "V3";
    if (
      endingAsset &&
      // Chained swaps should work as a pipe regarding the traded assets:
      // The last asset of swap 1 should be the first asset of swap 2
      // and the same pool version should be used for both swaps
      (endingAsset.asset !== tokens[0] || endingAsset.poolVersion !== poolVersion)
    ) {
      return false;
    } else {
      endingAsset = {
        poolVersion,
        asset: tokens[tokens.length - 1],
      };
    }
  }

  return true;
};

/**
 * @ignore for external documentation
 *
 * Provides a list of commands and associated tokens for a given Uniswap calldata
 *
 * @param {`0x${string}`} calldata
 * @param {number} chainId
 * @returns {CommandsAndTokens}
 */
export const getCommandsAndTokensFromUniswapCalldata = (
  calldata: `0x${string}`,
  chainId: number,
): CommandsAndTokens => {
  try {
    const [commands, inputs] = new Interface([
      "function execute(bytes calldata commands, bytes[] calldata inputs, uint256 deadline) external payable",
    ]).decodeFunctionData("execute", calldata) as [`0x${string}`, `0x${string}`[]];

    const commandsBuffer = Buffer.from(commands.slice(2), "hex");
    return commandsBuffer.reduce((acc, curr, i) => {
      const commandName = UNISWAP_COMMANDS[`0x${curr.toString(16).padStart(2, "0")}`];
      if (!commandName) return [...acc, [undefined, []]];

      const commandDecoder = UniswapDecoders[commandName];
      return [...acc, [commandName, commandDecoder(inputs[i], chainId)]];
    }, [] as CommandsAndTokens);
  } catch (e) {
    log("Uniswap", "Error decoding Uniswap calldata", e);
    return [];
  }
};

/**
 * @ignore for external documentation
 *
 * Returns the necessary APDUs to load the Uniswap plugin
 * and the token descriptors for a transaction
 *
 * @param {Transaction} transaction
 * @param {number} chainId
 * @param {LoadConfig} userConfig
 * @returns {Promise<{ pluginData?: Buffer; tokenDescriptors?: Buffer[] }>}
 */
export const loadInfosForUniswap = async (
  transaction: Transaction,
  chainId: number,
  userConfig?: LoadConfig,
): Promise<{ pluginData?: Buffer; tokenDescriptors?: Buffer[] }> => {
  const selector = transaction.data.slice(0, 10) as `0x${string}`;
  const commandsAndTokens = getCommandsAndTokensFromUniswapCalldata(
    transaction.data as `0x${string}`,
    chainId,
  );
  if (!isSupported(selector, transaction.to, chainId, commandsAndTokens)) {
    return {};
  }

  const uniqueTokens = Array.from(new Set(commandsAndTokens.flatMap(([, tokens]) => tokens)));
  const tokenDescriptorsPromises = Promise.all(
    uniqueTokens.map(async token => {
      const erc20SignaturesBlob = await findERC20SignaturesInfo(userConfig || {}, chainId);
      return byContractAddressAndChainId(token, chainId, erc20SignaturesBlob)?.data;
    }),
  );

  const tokenDescriptors = await tokenDescriptorsPromises.then(descriptors =>
    descriptors.filter((descriptor): descriptor is Buffer => !!descriptor),
  );

  const pluginName = "Uniswap";
  // 1 byte for the length of the plugin name
  const lengthBuff = Buffer.alloc(1);
  lengthBuff.writeUIntBE(pluginName.length, 0, 1);
  // dynamic length bytes for the plugin name
  const pluginNameBuff = Buffer.from(pluginName);
  // 20 bytes for the contract address
  const contractAddressBuff = Buffer.from(UNISWAP_UNIVERSAL_ROUTER_ADDRESS.slice(2), "hex");
  // 4 bytes for the selector
  const selectorBuff = Buffer.from(UNISWAP_EXECUTE_SELECTOR.slice(2), "hex");
  // 70 bytes for the signature
  const signature = Buffer.from(
    // Signature is hardcoded as it would create issues by being in the CAL ethereum.json file
    "3044022014391e8f355867a57fe88f6a5a4dbcb8bf8f888a9db3ff3449caf72d120396bd02200c13d9c3f79400fe0aa0434ac54d59b79503c9964a4abc3e8cd22763e0242935",
    "hex",
  );

  const pluginData = Buffer.concat([
    lengthBuff,
    pluginNameBuff,
    contractAddressBuff,
    selectorBuff,
    signature,
  ]);

  return {
    pluginData,
    tokenDescriptors,
  };
};
