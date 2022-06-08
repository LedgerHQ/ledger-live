import { MessageData } from "../../hw/signMessage/types";
import { Account } from "../../types";

const prepareMessageToSign = (
  account: Account,
  message: string
): MessageData => {
  return {
    currency: account.currency,
    path: account.freshAddressPath,
    derivationMode: account.derivationMode,
    message: message,
    rawMessage: Buffer.from(message).toString("hex"),
  };
};

export default prepareMessageToSign;
