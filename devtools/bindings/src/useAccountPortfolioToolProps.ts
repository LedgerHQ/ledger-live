import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { accountsSlice, type AccountsState } from "@domain/entity-account";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import { bodyOf, describeSent } from "./portfolioActions/requests";
import { RUNNERS, type PortfolioDispatch } from "./portfolioActions/runners";
import type {
  AccountPortfolioToolProps,
  PortfolioRequest,
  PortfolioResult,
} from "./portfolioActions/types";
import { registrationOf } from "./portfolioRegistration";

/** Both apps mount the accounts slice at `accountEntries`. */
type State = { accountEntries: AccountsState };

const { selectAccountEntries } = accountsSlice.getSelectors((state: State) => state.accountEntries);

const labelOf = (descriptor: AccountDescriptor) =>
  `${descriptor.network.name} ${
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

  return { accounts, defaultPortfolioId: "ledger-live-poc", serviceUrl, onRun };
}
