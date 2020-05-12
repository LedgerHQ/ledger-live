// @flow
import invariant from "invariant";
import { Buffer } from "buffer";
import { byContractAddress } from "@ledgerhq/hw-app-eth/erc20";
import Eth from "@ledgerhq/hw-app-eth";
import type Transport from "@ledgerhq/hw-transport";
import EthereumTx from "ethereumjs-tx";
import { getCryptoCurrencyById } from "../../currencies";
import type { TokenCurrency } from "../../types";
import { getNetworkId } from "./ethereum";

const transferMethodID = Buffer.from("a9059cbb", "hex");
const ethereum = getCryptoCurrencyById("ethereum");

export default async (
  token: TokenCurrency,
  transport: Transport<*>,
  path: string,
  t: {
    nonce: string,
    recipient: string,
    gasPrice: string,
    gasLimit: string,
    amount: string,
  }
) => {
  const tokenInfo = byContractAddress(token.contractAddress);
  invariant(
    tokenInfo,
    `contract ${token.contractAddress} data for ${token.id} ERC20 not found`
  );

  const chainId = getNetworkId(ethereum);
  invariant(chainId, `chainId not found for currency ${ethereum.name}`);
  const to256 = Buffer.concat([
    Buffer.alloc(12),
    Buffer.from(t.recipient.replace(/^0x/g, ""), "hex"),
  ]);
  invariant(to256.length === 32, "recipient is invalid");
  const amountHex = t.amount.replace(/^0x/g, "");
  const amount = Buffer.from(
    amountHex.length % 2 === 0 ? amountHex : "0" + amountHex,
    "hex"
  );
  const amount256 = Buffer.concat([Buffer.alloc(32 - amount.length), amount]);

  const data = Buffer.concat([transferMethodID, to256, amount256]);
  const tx = new EthereumTx({
    nonce: t.nonce,
    gasPrice: t.gasPrice,
    gasLimit: t.gasLimit,
    to: token.contractAddress,
    value: 0x00,
    data: "0x" + data.toString("hex"),
    chainId,
  });
  tx.raw[6] = Buffer.from([chainId]); // v
  tx.raw[7] = Buffer.from([]); // r
  tx.raw[8] = Buffer.from([]); // s

  const eth = new Eth(transport);
  await eth.provideERC20TokenInformation(tokenInfo);
  const result = await eth.signTransaction(
    path,
    tx.serialize().toString("hex")
  );

  // Second, we re-set some tx fields from the device signature

  tx.v = Buffer.from(result.v, "hex");
  tx.r = Buffer.from(result.r, "hex");
  tx.s = Buffer.from(result.s, "hex");
  const signedChainId = Math.floor((tx.v[0] - 35) / 2); // EIP155: v should be chain_id * 2 + {35, 36}
  const validChainId = chainId & 0xff; // eslint-disable-line no-bitwise
  invariant(
    signedChainId === validChainId,
    `Invalid chainId signature returned. Expected: ${chainId}, Got: ${signedChainId}`
  );

  // Finally, we can send the transaction string to broadcast
  return `0x${tx.serialize().toString("hex")}`;
};
