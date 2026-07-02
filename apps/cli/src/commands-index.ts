import botTransfer from "./commands/blockchain/botTransfer";
import getAddress from "./commands/blockchain/getAddress";
import send from "./commands/blockchain/send";
import tokenAllowance from "./commands/blockchain/tokenAllowance";
import tokenApproval from "./commands/blockchain/tokenApproval";
import generateAddresses from "./commands/live/generateAddresses";
import generateAppJson from "./commands/live/generateAppJson";
import generateUtxoAddresses from "./commands/live/generateUtxoAddresses";
import liveData from "./commands/live/liveData";
import version from "./commands/live/version";

export default {
  botTransfer,
  getAddress,
  send,
  tokenAllowance,
  tokenApproval,
  generateAddresses,
  generateAppJson,
  generateUtxoAddresses,
  liveData,
  version,
};
