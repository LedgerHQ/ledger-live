import type {
  BufferTxData,
  MemoNotSupported,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import { encodeFunctionData, erc20Abi } from "viem";

/** The transaction shape shared by craft and estimate, before gas/nonce/chain. */
export type CeloTxParams = {
  to: `0x${string}`;
  data: `0x${string}`;
  value: bigint;
  feeCurrency?: `0x${string}`;
};

const toHex = (buffer: Buffer): `0x${string}` => `0x${buffer.toString("hex")}`;

/**
 * Derives the on-chain target, calldata and value from a transaction intent,
 * following the same rules as coin-evm's `getCallData`/`prepareUnsignedTxParams`:
 *
 * - An explicit `intent.data` payload (a contract interaction) takes precedence.
 * - Otherwise, native CELO send → `to` = recipient, `value` = amount, empty calldata;
 *   token (ERC-20) send → `to` = the token contract (`asset.assetReference`),
 *   `value` = 0, calldata = `transfer(recipient, amount)`.
 *
 * `feeCurrency` (a CIP-64 adapter address) is attached unchanged when provided;
 * it is orthogonal to the asset being sent.
 */
export const buildCeloTxParams = (
  intent: TransactionIntent<MemoNotSupported, BufferTxData>,
  feeCurrency?: `0x${string}`,
): CeloTxParams => {
  const recipient = intent.recipient as `0x${string}`;
  const { asset } = intent;
  const feeCurrencyField = feeCurrency ? { feeCurrency } : {};

  const explicitData = intent.data?.value;
  const explicitHex =
    Buffer.isBuffer(explicitData) && explicitData.length > 0 ? toHex(explicitData) : undefined;

  if (asset.type === "native") {
    return {
      to: recipient,
      data: explicitHex ?? "0x",
      value: intent.amount,
      ...feeCurrencyField,
    };
  }

  // `asset` is the non-native (token) variant here, but AssetInfo's union is not
  // cleanly discriminated (the token variant's `type` is `string`), so narrow by cast.
  const contractAddress = (asset as { assetReference?: string }).assetReference;
  if (!contractAddress) {
    throw new Error(
      "celo: token transfer intent is missing asset.assetReference (token contract address)",
    );
  }

  return {
    to: contractAddress as `0x${string}`,
    data:
      explicitHex ??
      encodeFunctionData({
        abi: erc20Abi,
        functionName: "transfer",
        args: [recipient, intent.amount],
      }),
    value: 0n,
    ...feeCurrencyField,
  };
};
