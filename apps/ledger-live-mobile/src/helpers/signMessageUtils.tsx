import { AnyMessage } from "@ledgerhq/types-live";
import { getEIP712FieldsDisplayedOnNano } from "@ledgerhq/evm-tools/message/EIP712/index";
import { getEnv } from "@ledgerhq/live-common/env";

export type MessageProperties = { label: string; value: string | string[] }[];

export const getMessageProperties = async (
  messageData: AnyMessage,
): Promise<MessageProperties | null> => {
  if (messageData.standard === "EIP712") {
    return getEIP712FieldsDisplayedOnNano(messageData.message, getEnv("DYNAMIC_CAL_BASE_URL"));
  }
  return null;
};

export default {
  getMessageProperties,
};
