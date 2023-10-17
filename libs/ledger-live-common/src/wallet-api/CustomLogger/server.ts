/* eslint-disable no-console */
import { RPCHandler, customWrapper } from "@ledgerhq/wallet-api-server";
import { LoggerParams, LoggerResponse, MethodIds } from "./types";

type Handlers = Record<MethodIds, RPCHandler<unknown, never>>;

export const handlers = {
  "custom.logger.debug": customWrapper<LoggerParams, LoggerResponse>(params =>
    console.debug(params?.message),
  ),
  "custom.logger.error": customWrapper<LoggerParams, LoggerResponse>(params =>
    console.error(params?.message),
  ),
  "custom.logger.info": customWrapper<LoggerParams, LoggerResponse>(params =>
    console.info(params?.message),
  ),
  "custom.logger.log": customWrapper<LoggerParams, LoggerResponse>(params =>
    console.log(params?.message),
  ),
  "custom.logger.warn": customWrapper<LoggerParams, LoggerResponse>(params =>
    console.warn(params?.message),
  ),
} as const satisfies Handlers;
