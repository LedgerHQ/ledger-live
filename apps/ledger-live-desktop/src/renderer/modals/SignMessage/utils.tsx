import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
// TODO move the specific parts to each family!
// eslint-disable-next-line no-restricted-imports
import {
  isEIP712Message,
  getNanoDisplayedInfosFor712,
} from "@ledgerhq/live-common/families/ethereum/hw-signMessage";
import { MessageData } from "@ledgerhq/live-common/hw/signMessage/types";
// TODO move the specific parts to each family!
// eslint-disable-next-line no-restricted-imports
import { TypedMessageData } from "@ledgerhq/live-common/families/ethereum/types";
import { NanoDisplayedInfoFor712 } from "./types";
import { getEnv } from "@ledgerhq/live-common/env";

export const getMessageProperties = async (
  currency: CryptoCurrency,
  messageData: TypedMessageData | MessageData,
): Promise<{ message: string; fields?: NanoDisplayedInfoFor712 }> => {
  try {
    if (currency.family === "ethereum") {
      const parsedMessage: Record<string, unknown> =
        typeof messageData.message === "string"
          ? JSON.parse(messageData.message)
          : messageData.message;

      if (!isEIP712Message(parsedMessage)) {
        throw new Error();
      }

      const fields = await getNanoDisplayedInfosFor712(
        parsedMessage,
        getEnv("DYNAMIC_CAL_BASE_URL"),
      );
      return {
        message: JSON.stringify(messageData.message),
        fields,
      };
    }
    throw new Error();
  } catch (e) {
    return {
      message:
        typeof messageData.message === "string"
          ? messageData.message
          : JSON.stringify(messageData.message),
    };
  }
};

export default {
  getMessageProperties,
};
