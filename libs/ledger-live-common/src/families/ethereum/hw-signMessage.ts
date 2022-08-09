import Eth from "@ledgerhq/hw-app-eth";
import {
  EIP712Message,
  isEIP712Message,
} from "@ledgerhq/hw-app-eth/lib/modules/EIP712/index";
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
  message: Pick<MessageData | TypedMessageData, "path" | "message"> &
    Partial<Pick<MessageData, "rawMessage">>
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
  const mess = Buffer.from(message, "hex").toString();
  try {
    const parsedMessage = JSON.parse(mess);
    if (isEIP712Message(parsedMessage)) {
      return parsedMessage as EIP712Message;
    }
  } catch {
    // Not a JSON message
  }
  return mess;
}

export const prepareMessageToSign = (
  currency: CryptoCurrency,
  path: string,
  derivationMode: DerivationMode,
  message: string
): MessageData | TypedMessageData => {
  const parsedMessage = tryConvertToJSON(message);

  if (typeof parsedMessage === "string") {
    return {
      currency,
      path,
      derivationMode,
      message: parsedMessage,
      rawMessage: "0x" + message,
    };
  } else {
    return {
      currency,
      path,
      derivationMode,
      message: parsedMessage,
    };
  }
};

const signMessage: EthSignMessage = async (
  transport,
  { path, message, rawMessage }
) => {
  const eth = new Eth(transport);
  const parsedMessage = (() => {
    try {
      return JSON.parse(message as string);
    } catch (e) {
      return message;
    }
  })();

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
