import { ethers } from "ethers";
import SHA224 from "crypto-js/sha224";
import { getEnv } from "@ledgerhq/live-env";
import network from "@ledgerhq/live-network/network";
import { EIP712Message } from "@ledgerhq/types-live";
import EIP712CAL from "@ledgerhq/cryptoassets/data/eip712";
import { MessageFilters } from "./types";

const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";

// As defined in [spec](https://eips.ethereum.org/EIPS/eip-712), the properties below are all required.
export function isEIP712Message(message: unknown): message is EIP712Message {
  return (
    !!message &&
    typeof message === "object" &&
    "types" in message &&
    "primaryType" in message &&
    "domain" in message &&
    "message" in message
  );
}

export const sortObjectAlphabetically = (obj: Record<string, unknown>): Record<string, unknown> => {
  const keys = Object.keys(obj).sort();

  return keys.reduce((acc, curr) => {
    const value = (() => {
      if (Array.isArray(obj[curr])) {
        return (obj[curr] as unknown[]).map(field =>
          sortObjectAlphabetically(field as Record<string, unknown>),
        );
      }
      return obj[curr];
    })();

    (acc as Record<string, unknown>)[curr] = value;
    return acc;
  }, {});
};

export const getSchemaHashForMessage = (message: EIP712Message): string => {
  const { types } = message;
  const sortedTypes = sortObjectAlphabetically(types);

  return SHA224(JSON.stringify(sortedTypes).replace(" ", "")).toString();
};

/**
 * Tries to find the proper filters for a given EIP712 message
 * in the CAL
 *
 * @param {EIP712Message} message
 * @returns {MessageFilters | undefined}
 */
export const getFiltersForMessage = async (
  message: EIP712Message,
  remoteCryptoAssetsListURI?: string | null,
): Promise<MessageFilters | undefined> => {
  const schemaHash = getSchemaHashForMessage(message);
  const messageId = `${message.domain?.chainId ?? 0}:${
    message.domain?.verifyingContract ?? NULL_ADDRESS
  }:${schemaHash}`;

  try {
    if (remoteCryptoAssetsListURI) {
      const { data: dynamicCAL } = await network<Record<string, MessageFilters>>({
        method: "GET",
        url: `${remoteCryptoAssetsListURI}/eip712.json`,
      });

      return dynamicCAL[messageId] || EIP712CAL[messageId as keyof typeof EIP712CAL];
    }
    throw new Error();
  } catch (e) {
    return EIP712CAL[messageId as keyof typeof EIP712CAL];
  }
};

/**
 * Get the value at a specific path of an object and return it as a string or as an array of string
 * Used recursively by getValueFromPath
 *
 * @see getValueFromPath
 */
const getValue = (
  path: string,
  value: Record<string, any> | Array<any> | string,
): Record<string, any> | Array<any> | string => {
  if (typeof value === "object") {
    if (Array.isArray(value)) {
      return value.map(v => getValue(path, v)).flat();
    }

    /* istanbul ignore if : unecessary test of a throw */
    if (!(path in value)) {
      throw new Error(`Could not find key ${value} in ${path}`);
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
const getValueFromPath = (path: string, eip721Message: EIP712Message): string | string[] => {
  const splittedPath = path.split(".");
  const { message } = eip721Message;

  let value: any = message;
  for (let i = 0; i <= splittedPath.length - 1; i++) {
    const subPath = splittedPath[i];
    const isLastElement = i >= splittedPath.length - 1;
    if (subPath === "[]" && !isLastElement) continue;

    value = getValue(subPath, value);
  }

  /* istanbul ignore if : unecessary test of a throw */
  if (value === message) {
    throw new Error("getValueFromPath returned the whole original message");
  }

  return value as string | string[];
};

/**
 * Gets the fields visible on the nano for a specific EIP712 message
 */
export const getEIP712FieldsDisplayedOnNano = async (
  messageData: EIP712Message,
  remoteCryptoAssetsListURI: string = getEnv("DYNAMIC_CAL_BASE_URL"),
): Promise<{ label: string; value: string | string[] }[] | null> => {
  if (!isEIP712Message(messageData)) {
    return null;
  }

  const { EIP712Domain, ...otherTypes } = messageData.types;
  const displayedInfos: { label: string; value: string | string[] }[] = [];
  const filters = await getFiltersForMessage(messageData, remoteCryptoAssetsListURI);

  if (!filters) {
    const { types } = messageData;
    const domainFields = types["EIP712Domain"].map(({ name }) => name);

    if (domainFields.includes("name") && messageData.domain.name) {
      displayedInfos.push({
        label: "name",
        value: messageData.domain.name,
      });
    }

    if (domainFields.includes("version") && messageData.domain.version) {
      displayedInfos.push({
        label: "version",
        value: messageData.domain.version,
      });
    }

    if (domainFields.includes("chainId") && messageData.domain.chainId) {
      displayedInfos.push({
        label: "chainId",
        value: messageData.domain.chainId.toString(),
      });
    }

    if (domainFields.includes("verifyingContract") && messageData.domain.verifyingContract) {
      displayedInfos.push({
        label: "verifyingContract",
        value: messageData.domain.verifyingContract.toString(),
      });
    }

    if (domainFields.includes("salt") && messageData.domain.salt) {
      displayedInfos.push({
        label: "salt",
        value: messageData.domain.salt.toString(),
      });
    }

    displayedInfos.push({
      label: "Message hash",
      value: ethers.utils._TypedDataEncoder.hashStruct(
        messageData.primaryType,
        otherTypes,
        messageData.message,
      ),
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

  for (const field of fields) {
    displayedInfos.push({
      label: field.label,
      value: getValueFromPath(field.path, messageData),
    });
  }

  return displayedInfos;
};
