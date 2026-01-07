/* eslint-disable no-console */
import { RPCHandler, customWrapper } from "@ledgerhq/wallet-api-server";

export type DeeplinkOpenParams = {
  url: string;
};

type Handlers = Record<"custom.deeplink.open", RPCHandler<void, DeeplinkOpenParams>>;

type DeeplinkUiHooks = {
  "custom.deeplink.open": (params?: { url: string }) => void;
};

export const handlers = ({
  uiHooks: { "custom.deeplink.open": uiDeeplinkOpen },
}: {
  uiHooks: DeeplinkUiHooks;
}) =>
  ({
    "custom.deeplink.open": customWrapper<DeeplinkOpenParams, void>(params =>
      uiDeeplinkOpen(params),
    ),
  }) as const satisfies Handlers;
