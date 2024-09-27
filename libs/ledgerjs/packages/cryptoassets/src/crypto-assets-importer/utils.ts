import { CALServiceOutput } from "./fetch";
import { ERC20Token } from "../types";

export const getErc20DescriptorsAndSignatures = (
  tokens: Pick<
    CALServiceOutput,
    | "id"
    | "blockchain_name"
    | "contract_address"
    | "decimals"
    | "delisted"
    | "name"
    | "ticker"
    | "live_signature"
  >[],
  chainId: number,
): { erc20: ERC20Token[]; erc20Signatures: Buffer } => {
  const erc20: ERC20Token[] = tokens.map(token => {
    // This shouldn't be necessary, we should consumme the ID directly
    // but for now, I'll keep this to maintain a compatibility layer
    // with the content of the CDN (which should be removed soon)
    const [, , tokenIdentifier] = token.id.split("/");

    return [
      token.blockchain_name.toLowerCase(),
      tokenIdentifier,
      token.ticker.toUpperCase(),
      token.decimals,
      token.name,
      token.live_signature,
      token.contract_address,
      false,
      token.delisted,
    ];
  });

  // Bufferize all the precomputed ProvideERC20TokenInformation APDUs
  const erc20Signatures = tokens.reduce((acc, token) => {
    // 1 byte for the length of the ticker
    const tickerLengthBuff = Buffer.alloc(1);
    tickerLengthBuff.writeUintBE(token.ticker.length, 0, 1);

    // ticker ascii
    const tickerBuff = Buffer.from(token.ticker);

    // bufferized address
    const addressBuff = Buffer.from(token.contract_address.slice(2), "hex");

    // 4 bytes for the decimals
    const decimalsBuff = Buffer.alloc(4);
    decimalsBuff.writeUintBE(token.decimals, 0, 4);

    // 4 bytes for the chainId
    const chainIdBuff = Buffer.alloc(4);
    chainIdBuff.writeUintBE(chainId, 0, 4);

    // bufferized live signature
    const liveSignatureBuff = Buffer.from(token.live_signature, "hex");

    const tokenBuff = Buffer.concat([
      tickerLengthBuff,
      tickerBuff,
      addressBuff,
      decimalsBuff,
      chainIdBuff,
      liveSignatureBuff,
    ]);
    // 4 bytes for the length of the token descriptor
    // Only used by hw-app-eth ERC20 blob parsing
    const tokenLengthBuff = Buffer.alloc(4);
    tokenLengthBuff.writeUintBE(tokenBuff.length, 0, 4);

    return Buffer.concat([acc, tokenLengthBuff, tokenBuff]);
  }, Buffer.alloc(0));

  return { erc20, erc20Signatures };
};
