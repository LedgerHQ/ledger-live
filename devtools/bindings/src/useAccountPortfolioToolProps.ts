import { useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { registrationOf } from "@domain/api-account-portfolio";
import { accountsSlice, type AccountsState } from "@domain/entity-account";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import { readOrCreatePortfolioId } from "@features/platform-account-portfolio";
import { bodyOf, describeSent } from "./portfolioActions/requests";
import { RUNNERS, type PortfolioDispatch } from "./portfolioActions/runners";
import type {
  AccountPortfolioToolProps,
  PortfolioRequest,
  PortfolioResult,
} from "./portfolioActions/types";

/** Both apps mount the accounts slice at `accountEntries`. */
type State = { accountEntries: AccountsState };

const { selectAccountEntries } = accountsSlice.getSelectors((state: State) => state.accountEntries);

const PORTFOLIO_ID_KEY = "ledger-live.devtools.account-portfolio-id";

/** A portfolio id private to this browser session. */
const sessionPortfolioId = () =>
  readOrCreatePortfolioId(globalThis.sessionStorage, PORTFOLIO_ID_KEY);

const labelOf = (descriptor: AccountDescriptor) =>
  `${descriptor.network} ${
    descriptor.type === "utxo" ? `${descriptor.xpub.slice(0, 12)}…` : descriptor.address
  }`;

/** `JSON.stringify(new Error())` is `{}`, so errors are turned into plain objects to be shown. */
const toDisplayable = (error: unknown): unknown =>
  error instanceof Error ? { name: error.name, message: error.message } : error;

export function useAccountPortfolioToolProps({
  serviceUrl,
}: Readonly<{ serviceUrl: string }>): AccountPortfolioToolProps {
  const dispatch = useDispatch<PortfolioDispatch>();
  const entries = useSelector(selectAccountEntries);
  const [defaultPortfolioId] = useState(sessionPortfolioId);

  // Only the accounts the service can take: the others have nothing to register or to read.
  const accounts = useMemo(
    () =>
      entries.flatMap(({ accountUUID, descriptor }) => {
        const registration = registrationOf(descriptor);
        return registration
          ? [
              {
                accountUUID,
                label: labelOf(descriptor),
                registration: JSON.stringify(registration, null, 2),
              },
            ]
          : [];
      }),
    [entries],
  );

  const onRun = useCallback(
    async (request: PortfolioRequest): Promise<PortfolioResult> => {
      const startedAt = Date.now();
      const elapsed = () => Date.now() - startedAt;
      const failed = (sent: PortfolioResult["sent"], error: unknown): PortfolioResult => ({
        ok: false,
        durationMs: elapsed(),
        sent,
        body: toDisplayable(error),
        currency: request.currency,
      });

      let payload: unknown;
      try {
        payload = bodyOf(request);
      } catch (error) {
        return failed(describeSent(serviceUrl, request, undefined), error);
      }
      const sent = describeSent(serviceUrl, request, payload);
      try {
        const { body, view } = await RUNNERS[request.action]({ dispatch, request, payload });
        return { ok: true, durationMs: elapsed(), sent, body, currency: request.currency, view };
      } catch (error) {
        return failed(sent, error);
      }
    },
    [dispatch, serviceUrl],
  );

  return { accounts, defaultPortfolioId, serviceUrl, onRun };
}
