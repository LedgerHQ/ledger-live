import { InvalidAddress } from "@ledgerhq/ledger-wallet-framework/errors";
import { log } from "@ledgerhq/logs";
import BigNumber from "bignumber.js";
import { CasperNetwork, PublicKey, Transaction } from "casper-js-sdk";
import { CASPER_DEFAULT_TTL, CASPER_NETWORK } from "../constants";
import { getCasperNodeRpcClient } from "../network/api";
import { isAddressValid } from "./validateAddress";

export const createNewTransaction = async (
  sender: string,
  recipient: string,
  amount: BigNumber,
  fees: BigNumber,
  transferId?: string,
  network = CASPER_NETWORK,
): Promise<Transaction> => {
  log("debug", `Creating new Transaction: ${sender}, ${recipient}, ${network}`);

  if (recipient && !isAddressValid(recipient)) {
    throw new InvalidAddress(`Invalid recipient Address ${recipient}`);
  }

  const client = getCasperNodeRpcClient();
  const helper = await CasperNetwork.create(client);

  const tx = helper.createTransferTransaction(
    PublicKey.fromHex(sender),
    PublicKey.fromHex(recipient),
    network,
    amount.toString(),
    fees.toNumber(),
    CASPER_DEFAULT_TTL,
    parseInt(transferId ?? "0"),
  );

  return tx;
};
