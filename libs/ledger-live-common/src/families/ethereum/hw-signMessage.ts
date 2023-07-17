import Eth from "@ledgerhq/hw-app-eth";
import { TypedDataUtils } from "eth-sig-util";
import { bufferToHex } from "ethereumjs-util";
import { isEIP712Message } from "@ledgerhq/evm-tools/message/EIP712/index";
import type { EIP712Message, TypedEvmMessage } from "@ledgerhq/types-live";
import type { SignMessage } from "../../hw/signMessage/types";

export const domainHash = (message: EIP712Message): Buffer => {
  return TypedDataUtils.hashStruct("EIP712Domain", message.domain, message.types, true);
};
export const messageHash = (message: EIP712Message): Buffer => {
  return TypedDataUtils.hashStruct(message.primaryType, message.message, message.types, true);
};

function tryConvertToJSON(message: string): string | EIP712Message {
  try {
    const parsedMessage = JSON.parse(message);
    if (isEIP712Message(parsedMessage)) {
      return parsedMessage;
    }
  } catch {
    // Not a JSON message
  }
  return message;
}

const prepareMessageToSign = ({ message }: { message: string }): TypedEvmMessage => {
  const parsedMessage = tryConvertToJSON(message);

  if (typeof parsedMessage === "string") {
    return {
      standard: "EIP191",
      message: parsedMessage,
    };
  } else {
    return {
      standard: "EIP712",
      message: parsedMessage,
      domainHash: bufferToHex(domainHash(parsedMessage)),
      hashStruct: bufferToHex(messageHash(parsedMessage)),
    };
  }
};

const signMessage: SignMessage = async (transport, account, messageData) => {
  const eth = new Eth(transport);

  let result:
    | {
        v: number;
        s: string;
        r: string;
      }
    | undefined;
  if (messageData.standard === "EIP191") {
    result = await eth.signPersonalMessage(
      account.freshAddressPath,
      Buffer.from(messageData.message).toString("hex"),
    );
  } else if (messageData.standard === "EIP712") {
    try {
      result = await eth.signEIP712Message(account.freshAddressPath, messageData.message);
    } catch (e) {
      if (e instanceof Error && "statusText" in e && e.statusText === "INS_NOT_SUPPORTED") {
        result = await eth.signEIP712HashedMessage(
          account.freshAddressPath,
          messageData.domainHash,
          messageData.hashStruct,
        );
      } else {
        throw e;
      }
    }
  }

  if (!result) throw new Error("Signature result is not defined");

  let v = result.v.toString(16);
  if (v.length < 2) {
    v = "0" + v;
  }

  const signature = `0x${result["r"]}${result["s"]}${v}`;
  return {
    rsv: result,
    signature,
  };
};

export default {
  prepareMessageToSign,
  signMessage,
};
