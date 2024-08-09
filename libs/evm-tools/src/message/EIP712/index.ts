import { ethers } from "ethers";
import axios from "axios";
import SHA224 from "crypto-js/sha224";
import { getEnv } from "@ledgerhq/live-env";
import { EIP712Message } from "@ledgerhq/types-live";
import EIP712CAL from "@ledgerhq/cryptoassets/data/eip712";
import EIP712CALV2 from "@ledgerhq/cryptoassets/data/eip712_v2";
import { CALServiceEIP712Response, MessageFilters } from "./types";

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
  shouldUseV1Filters?: boolean,
  calServiceURL?: string | null,
): Promise<MessageFilters | undefined> => {
  const schemaHash = getSchemaHashForMessage(message);
  const verifyingContract =
    message.domain?.verifyingContract?.toLowerCase() || ethers.constants.AddressZero;
  try {
    if (calServiceURL) {
      const { data } = await axios.get<CALServiceEIP712Response>(`${calServiceURL}/v1/dapps`, {
        params: {
          output: "eip712_signatures",
          eip712_signatures_version: shouldUseV1Filters ? "v1" : "v2",
          chain_id: message.domain?.chainId,
          contracts: verifyingContract,
        },
      });

      const filters = data?.[0]?.eip712_signatures?.[verifyingContract]?.[schemaHash];
      if (!filters) {
        // Fallback to catch
        throw new Error("Fallback to static file");
      }

      return filters;
    }
    // Fallback to catch
    throw new Error("Fallback to static file");
  } catch (e) {
    const messageId = `${message.domain?.chainId ?? 0}:${verifyingContract}:${schemaHash}`;

    if (shouldUseV1Filters) {
      return EIP712CAL[messageId as keyof typeof EIP712CAL];
    }
    return EIP712CALV2[messageId as keyof typeof EIP712CALV2] as MessageFilters;
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
      throw new Error(`Could not find key ${path} in ${JSON.stringify(value)} `);
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
export const getValueFromPath = (path: string, eip721Message: EIP712Message): string | string[] => {
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
  calServiceURL: string = getEnv("CAL_SERVICE_URL"),
): Promise<{ label: string; value: string | string[] }[] | null> => {
  if (!isEIP712Message(messageData)) {
    return null;
  }

  const { EIP712Domain, ...otherTypes } = messageData.types;
  const displayedInfos: { label: string; value: string | string[] }[] = [];
  const filters = await getFiltersForMessage(messageData, false, calServiceURL);

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
