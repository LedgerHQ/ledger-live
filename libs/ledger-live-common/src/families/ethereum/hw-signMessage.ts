import Eth, { isEIP712Message } from "@ledgerhq/hw-app-eth";
import { EIP712Message } from "@ledgerhq/hw-app-eth/lib/modules/EIP712/EIP712.types";
import Transport from "@ledgerhq/hw-transport";
import { TypedDataUtils } from "eth-sig-util";
import { bufferToHex } from "ethereumjs-util";
import { getEnv } from "../../env";
import type { MessageData, Result } from "../../hw/signMessage/types";
import type { TypedMessageData } from "./types";
import { DerivationMode } from "../../derivation";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

type EthSignMessage = (
  transport: Transport,
  message: Pick<
    MessageData | TypedMessageData,
    "path" | "message" | "rawMessage"
  >
) => Promise<Result>;

export const domainHash = (message: EIP712Message): Buffer => {
  return TypedDataUtils.hashStruct(
    "EIP712Domain",
    message.domain,
    message.types,
    true
  );
};
export const messageHash = (message: EIP712Message): Buffer => {
  return TypedDataUtils.hashStruct(
    message.primaryType,
    message.message,
    message.types,
    true
  );
};

function tryConvertToJSON(message: string): string | EIP712Message {
  try {
    const parsedMessage = JSON.parse(message);
    if (isEIP712Message(parsedMessage)) {
      return parsedMessage as EIP712Message;
    }
  } catch {
    // Not a JSON message
  }
  return message;
}

const prepareMessageToSign = (
  currency: CryptoCurrency,
  path: string,
  derivationMode: DerivationMode,
  message: string
): MessageData | TypedMessageData => {
  const hexToStringMessage = Buffer.from(message, "hex").toString();
  const parsedMessage = tryConvertToJSON(hexToStringMessage);

  const messageData = {
    currency,
    path,
    derivationMode,
    rawMessage: "0x" + message,
  };
  if (typeof parsedMessage === "string") {
    return {
      ...messageData,
      message: parsedMessage,
    };
  } else {
    return {
      ...messageData,
      message: parsedMessage,
      hashes: {
        stringHash: "",
        domainHash: bufferToHex(domainHash(parsedMessage)),
        messageHash: bufferToHex(messageHash(parsedMessage)),
      },
    };
  }
};

type PartialMessageData = {
  path: string;
  message: string | EIP712Message;
  rawMessage: string;
};
const signMessage: EthSignMessage = async (
  transport: Transport,
  { path, message, rawMessage }: PartialMessageData
) => {
  const eth = new Eth(transport);
  let parsedMessage = message;
  if (typeof message === "string") {
    parsedMessage = tryConvertToJSON(message);
  }

  let result: Awaited<ReturnType<typeof eth.signPersonalMessage>>;
  if (typeof parsedMessage === "string") {
    result = await eth.signPersonalMessage(path, rawMessage?.slice(2) || "");
    result.v -= 27;
    // here the expected v is the parity/recoveryId, so we need to remove 27 (v is either 27 or 28)
  } else {
    result = getEnv("EXPERIMENTAL_EIP712")
      ? await eth.signEIP712Message(path, parsedMessage)
      : await eth.signEIP712HashedMessage(
          path,
          bufferToHex(domainHash(parsedMessage)),
          bufferToHex(messageHash(parsedMessage))
        );
    // result.v stays untouched for EIP712 as the expected v is already good (27 or 28)
  }

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

export default { prepareMessageToSign, signMessage };
