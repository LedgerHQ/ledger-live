import { createUnknownError, ServerError } from "@ledgerhq/wallet-api-core";
import { RPCHandler, customWrapper } from "@ledgerhq/wallet-api-server";
import type { AccountLike } from "@ledgerhq/types-live";
import { getAccountIdFromWalletAccountId } from "../converters";
import { resolveIntents } from "./resolver";
import type {
  StakingIntentOpenParams,
  StakingIntentOpenResult,
  StakingIntentListParams,
  StakingIntentListResult,
} from "./types";
import { VALID_INTENTS } from "./types";

export type StakingIntentUiHooks = {
  "custom.earn.intent.open": (params: StakingIntentOpenParams) => void;
};

type Handlers = {
  "custom.earn.intent.open": RPCHandler<StakingIntentOpenResult, StakingIntentOpenParams>;
  "custom.earn.intent.list": RPCHandler<StakingIntentListResult, StakingIntentListParams>;
};

export const handlers = ({
  accounts,
  uiHooks,
}: {
  accounts: AccountLike[];
  uiHooks: StakingIntentUiHooks;
}) =>
  ({
    "custom.earn.intent.open": customWrapper<StakingIntentOpenParams, StakingIntentOpenResult>(
      params => {
        if (!params?.accountId) {
          throw new ServerError(createUnknownError({ message: "accountId is required" }));
        }
        if (!params.intent || !VALID_INTENTS.includes(params.intent)) {
          throw new ServerError(
            createUnknownError({
              message: `intent must be one of: ${VALID_INTENTS.join(", ")}`,
            }),
          );
        }
        uiHooks["custom.earn.intent.open"](params);
      },
    ),

    "custom.earn.intent.list": customWrapper<StakingIntentListParams, StakingIntentListResult>(
      params => {
        if (!params?.accountId) {
          throw new ServerError(createUnknownError({ message: "accountId is required" }));
        }

        const realAccountId = getAccountIdFromWalletAccountId(params.accountId);
        if (!realAccountId) {
          throw new ServerError(
            createUnknownError({ message: `accountId ${params.accountId} unknown` }),
          );
        }

        const account = accounts.find(a => a.id === realAccountId);
        if (!account) {
          throw new ServerError(createUnknownError({ message: "account not found" }));
        }

        const intents = resolveIntents(account);
        return { intents };
      },
    ),
  }) as const satisfies Handlers;
