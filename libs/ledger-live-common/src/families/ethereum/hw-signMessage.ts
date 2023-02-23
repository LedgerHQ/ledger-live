import Eth, { isEIP712Message } from "@ledgerhq/hw-app-eth";
import { EIP712Message } from "@ledgerhq/hw-app-eth/lib/modules/EIP712/EIP712.types";
import { getFiltersForMessage } from "@ledgerhq/hw-app-eth";
import Transport from "@ledgerhq/hw-transport";
import { TypedDataUtils } from "eth-sig-util";
import { bufferToHex } from "ethereumjs-util";
import type { MessageData, Result } from "../../hw/signMessage/types";
import type { TypedMessageData } from "./types";
import { DerivationMode } from "@ledgerhq/coin-framework/derivation";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getEnv } from "../../env";

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
    result = await eth.signPersonalMessage(
      path,
      rawMessage
        ? rawMessage?.slice(2)
        : Buffer.from(parsedMessage).toString("hex") || ""
    );
  } else {
    try {
      result = await eth.signEIP712Message(path, parsedMessage);
    } catch (e) {
      if (
        e instanceof Error &&
        // @ts-expect-error TransportStatusError to be typed on ledgerjs
        e.statusText === "INS_NOT_SUPPORTED"
      ) {
        result = await eth.signEIP712HashedMessage(
          path,
          bufferToHex(domainHash(parsedMessage)),
          bufferToHex(messageHash(parsedMessage))
        );
      } else {
        throw e;
      }
    }
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

/**
 * Get the value at a specific path of an object and return it as a string or as an array of string
 * Used recursively by getValueFromPath
 *
 * @see getValueFromPath
 */
const getValue = (
  path: string,
  value: Record<string, any> | Array<any> | string
): Record<string, any> | Array<any> | string => {
  if (typeof value === "object") {
    if (Array.isArray(value)) {
      return value.map((v) => getValue(path, v)).flat();
    }

    if (!Object.prototype.hasOwnProperty.call(value, path)) {
      throw new Error();
    }
    const result = value[path];
    return typeof result === "object" ? result : result.toString();
  }

  return value.toString();
};

/**
 * Using a path as a string, returns the value(s) of a json key without worrying about depth or arrays
 * (e.g: 'to.wallets.[]' => ["0x123", "0x456"])
 */
const getValueFromPath = (
  path: string,
  eip721Message: EIP712Message
): string | string[] => {
  const splittedPath = path.split(".");
  const { message } = eip721Message;

  let value: any = message;
  for (let i = 0; i <= splittedPath.length - 1; i++) {
    const subPath = splittedPath[i];
    const isLastElement = i >= splittedPath.length - 1;
    if (subPath === "[]" && !isLastElement) continue;

    value = getValue(subPath, value);
  }

  if (value === message) {
    throw new Error();
  }

  return value as string | string[];
};

/**
 * Gets the fields visible on the nano for a specific EIP712 message
 */
export const getNanoDisplayedInfosFor712 = async (
  message: Record<string, any>,
  remoteCryptoAssetsListURI: string = getEnv("DYNAMIC_CAL_BASE_URL")
): Promise<{ label: string; value: string | string[] }[] | null> => {
  if (!isEIP712Message(message)) {
    return null;
  }

  const displayedInfos: { label: string; value: string | string[] }[] = [];
  const filters = await getFiltersForMessage(
    message,
    remoteCryptoAssetsListURI
  );

  if (!filters) {
    const { types } = message;
    const domainFields = types["EIP712Domain"].map(({ name }) => name);

    if (domainFields.includes("name") && message.domain.name) {
      displayedInfos.push({
        label: "name",
        value: message.domain.name,
      });
    }

    if (domainFields.includes("version") && message.domain.version) {
      displayedInfos.push({
        label: "version",
        value: message.domain.version,
      });
    }

    if (domainFields.includes("chainId") && message.domain.chainId) {
      displayedInfos.push({
        label: "chainId",
        value: message.domain.chainId.toString(),
      });
    }

    if (
      domainFields.includes("verifyingContract") &&
      message.domain.verifyingContract
    ) {
      displayedInfos.push({
        label: "verifyingContract",
        value: message.domain.verifyingContract.toString(),
      });
    }

    if (domainFields.includes("salt") && message.domain.salt) {
      displayedInfos.push({
        label: "salt",
        value: message.domain.salt.toString(),
      });
    }

    displayedInfos.push({
      label: "Message hash",
      value: "0x" + messageHash(message).toString("hex"),
    });

    return displayedInfos;
  }

  const { contractName, fields } = filters;
  if (contractName && contractName.label) {
    displayedInfos.push({
      label: "Contract",
      value: contractName.label,
    });
  }

  if (message.domain.version) {
    displayedInfos.push({
      label: "version",
      value: message.domain.version.toString(),
    });
  }

  for (const field of fields) {
    displayedInfos.push({
      label: field.label,
      value: getValueFromPath(field.path, message),
    });
  }

  return displayedInfos;
};

export { isEIP712Message, getFiltersForMessage };

export default {
  prepareMessageToSign,
  signMessage,
};
