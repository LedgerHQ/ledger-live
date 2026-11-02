import type { ApiServiceDescriptor } from "../../compose";
import { cardApi, cardApiExtra, type CardApi } from "./api";
import type { CardApiExtra } from "./types";

export function cardService(own: () => CardApiExtra): ApiServiceDescriptor<CardApi> {
  return { api: cardApi, buildExtra: () => cardApiExtra(own()) };
}
