import axios from "axios";
import SHA224 from "crypto-js/sha224";
import { getEnv } from "@ledgerhq/live-env";
import { EIP712Message } from "@ledgerhq/types-live";
import { AddressZero } from "@ethersproject/constants";
import { _TypedDataEncoder as TypedDataEncoder } from "@ethersproject/hash";
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
 * @param {boolean} shouldUseV1Filters
 * @param {string | null} calServiceURL
 * @param {Record<string, any> | null | undefined} staticEIP712SignaturesV1 - Static EIP712 signatures v1 fallback
 * @param {Record<string, any> | null | undefined} staticEIP712SignaturesV2 - Static EIP712 signatures v2 fallback
 * @returns {MessageFilters | undefined}
 */
export const getFiltersForMessage = async (
  message: EIP712Message,
  shouldUseV1Filters?: boolean,
  calServiceURL?: string | null,
  staticEIP712SignaturesV1?: Record<string, any> | null,
  staticEIP712SignaturesV2?: Record<string, any> | null,
): Promise<MessageFilters | undefined> => {
  const schemaHash = getSchemaHashForMessage(message);

  const verifyingContract = message.domain?.verifyingContract?.toLowerCase() || AddressZero;
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

      // Rather than relying on array indices, find the right object wherever it may be, if it exists
      const targetObject = data.find(
        item => item?.eip712_signatures?.[verifyingContract]?.[schemaHash],
      );

      const filters = targetObject?.eip712_signatures?.[verifyingContract]?.[schemaHash];

      if (!filters) {
        // Fallback to catch
        throw new Error("Fallback to static file");
      }

      return filters;
    }
    // Fall through to static fallback
    throw new Error("No CAL service URL");
  } catch {
    // Static fallback from injected signatures (for external library users)
    const messageId = `${message.domain?.chainId ?? 0}:${verifyingContract}:${schemaHash}`;

    if (shouldUseV1Filters && staticEIP712SignaturesV1) {
      return staticEIP712SignaturesV1[messageId] as MessageFilters | undefined;
    }
    if (!shouldUseV1Filters && staticEIP712SignaturesV2) {
      return staticEIP712SignaturesV2[messageId] as MessageFilters | undefined;
    }

    return undefined;
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

function formatDate(timestamp: string) {
  const date = new Date(Number(timestamp) * 1000);

  if (isNaN(date.getTime())) {
    return timestamp;
  }

  const formatter = new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "UTC",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const p = (type: string) => parts.find(p => p.type === type)?.value || "00";

  return `${p("year")}-${p("month")}-${p("day")} ${p("hour")}:${p("minute")}:${p("second")} UTC`;
}

/**
 * Gets the fields visible on the nano for a specific EIP712 message
 */
export const getEIP712FieldsDisplayedOnNano = async (
  messageData: EIP712Message,
  calServiceURL: string = getEnv("CAL_SERVICE_URL"),
  staticEIP712SignaturesV1?: Record<string, any> | null,
  staticEIP712SignaturesV2?: Record<string, any> | null,
): Promise<{ label: string; value: string | string[] }[] | null> => {
  if (!isEIP712Message(messageData)) {
    return null;
  }
  const { EIP712Domain, ...otherTypes } = messageData.types;
  const displayedInfos: { label: string; value: string | string[] }[] = [];
  const filters = await getFiltersForMessage(
    messageData,
    false,
    calServiceURL,
    staticEIP712SignaturesV1,
    staticEIP712SignaturesV2,
  );

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
      value: TypedDataEncoder.hashStruct(messageData.primaryType, otherTypes, messageData.message),
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

  if (messageData.primaryType === "PermitSingle") {
    for (const field of fields) {
      if (field.path.includes("token")) {
        displayedInfos.push({
          label: "Token",
          value: getValueFromPath(field.path, messageData),
        });
      } else if (field.path.includes("amount")) {
        displayedInfos.push({
          label: "Amount",
          value: getValueFromPath(field.path, messageData),
        });
      } else if (field.path.includes("expiration")) {
        displayedInfos.push({
          label: "Approval expires",
          value: formatDate(getValueFromPath(field.path, messageData) as string),
        });
      }
    }
  } else {
    for (const field of fields) {
      displayedInfos.push({
        label: field.label,
        value: getValueFromPath(field.path, messageData),
      });
    }
  }

  return displayedInfos;
};
