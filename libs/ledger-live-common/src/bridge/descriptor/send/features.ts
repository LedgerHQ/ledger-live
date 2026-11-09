import { createSendFeatures, type SendFeatures } from "@features/platform-send-flow/descriptor";
import { getSendDescriptor } from "../registry";

export const sendFeatures: SendFeatures = createSendFeatures(getSendDescriptor);
