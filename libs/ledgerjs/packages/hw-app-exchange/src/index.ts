import { getExchangeErrorMessage } from "./ReturnCode";
import Exchange, {
  createExchange,
  ExchangeTypes,
  RateTypes,
  PartnerKeyInfo,
  isExchangeTypeNg,
  PayloadSignatureComputedFormat,
  swapPayloadFormatOf,
} from "./Exchange";
import { decodeSwapPayload, decodePayloadProtobuf } from "./SwapUtils";
import { decodeSellPayload } from "./SellUtils";
import { decodeFundPayload } from "./FundUtils";

export {
  createExchange,
  decodePayloadProtobuf,
  decodeSwapPayload,
  getExchangeErrorMessage,
  ExchangeTypes,
  RateTypes,
  PartnerKeyInfo,
  isExchangeTypeNg,
  PayloadSignatureComputedFormat,
  swapPayloadFormatOf,
  decodeSellPayload,
  decodeFundPayload,
};
export { findSwapPayloadSpecViolation } from "./SwapUtils";
export { SwapPayloadFieldExceedsLimit } from "./errors";
export { checkSwapPayload } from "./SwapPayloadChecker";
export type {
  DecodedSwapPayload,
  SwapPayloadCheckInput,
  SwapPayloadCheckReport,
  SwapPayloadIssue,
  SwapPayloadIssueCode,
} from "./SwapPayloadChecker";
export { checkSellPayload } from "./SellPayloadChecker";
export type {
  DecodedSellPayload,
  SellPayloadCheckInput,
  SellPayloadCheckReport,
} from "./SellPayloadChecker";
export { classifySwapNgSignature } from "./SwapSignature";
export type { SwapNgPartnerPublicKey, SwapNgSignatureClassification } from "./SwapSignature";

export default Exchange;
