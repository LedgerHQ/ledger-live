import { useCallback, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createSelector, type ThunkDispatch, type UnknownAction } from "@reduxjs/toolkit";
import type { DevToolsConfig } from "@devtools/registry";
import {
  broadcastSend,
  estimateSendFees,
  prepareSend,
  releaseSend,
  signSend,
  type PreparedSend,
  type SendSignEvent,
  type SignedSend,
  type SigningDevice,
} from "@domain/api-account-transaction";
import { accountsSlice, type AccountsState } from "@domain/entity-account";
import type { WithAccountBalances } from "@domain/entity-account-balance";
import { currencyIdFromNetwork, type NetworkId } from "@domain/entity-account-descriptor";
import {
  SendRequestSchema,
  type SendRequest,
  type TransactionIssue,
} from "@domain/entity-account-transaction";
import { filter, lastValueFrom, type Observable } from "rxjs";

type AccountTransactionToolProps = Extract<
  DevToolsConfig[number],
  { id: "account-transaction" }
>["config"];

type ToolRequest = Parameters<AccountTransactionToolProps["onPrepare"]>[1];

/** Both apps mount the accounts slice at `accountEntries`. */
type State = Partial<WithAccountBalances> & { accountEntries: AccountsState };

type Dispatch = ThunkDispatch<State, unknown, UnknownAction>;

const { selectAccountEntries } = accountsSlice.getSelectors((state: State) => state.accountEntries);

/** The id of `@devtools/mock-accounts`' source, the only one that signs without a device. */
const MOCK_SOURCE_ID = "mock";

// The mock source never reads the device, and a real DeviceManagementKit cannot be built here.
const SIMULATED_DEVICE = { sessionId: "devtools", compatDeviceId: "devtools" } as SigningDevice;

type HeldAssetIds = Readonly<Record<string, readonly string[]>>;

const selectHeldAssetIds = createSelector(
  [(state: State) => state.accountBalances],
  (balances): HeldAssetIds =>
    Object.fromEntries(
      Object.entries(balances ?? {}).map(([accountUUID, rows]) => [
        accountUUID,
        (rows ?? []).map(row => row.assetId),
      ]),
    ),
);

/** Balance amounts change often, the assets an account holds rarely: re-render only on those. */
function sameHeldAssetIds(a: HeldAssetIds, b: HeldAssetIds): boolean {
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every(key => {
    const left = a[key];
    const right = b[key];
    return (
      right !== undefined &&
      left.length === right.length &&
      left.every((assetId, index) => assetId === right[index])
    );
  });
}

/** Undefined for a network the currencies do not know, rather than throwing on every render. */
function nativeAssetIdOf(network: NetworkId): string | undefined {
  try {
    return currencyIdFromNetwork(network);
  } catch {
    return undefined;
  }
}

class ToolRequestError extends Error {
  override name = "ToolRequestError";
}

function jsonObjectOf(name: string, text: string): Record<string, unknown> | undefined {
  if (!text.trim()) return undefined;
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new ToolRequestError(`${name}: ${error instanceof Error ? error.message : error}`);
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new ToolRequestError(`${name} must be a JSON object`);
  }
  return Object.fromEntries(Object.entries(parsed));
}

/** The form as a `SendRequest`, its empty fields left out; throws a readable error when invalid. */
function sendRequestOf(form: ToolRequest): SendRequest {
  const parsed = SendRequestSchema.safeParse({
    assetId: form.assetId,
    recipient: form.recipient.trim(),
    amount: form.useAllAmount ? "0" : form.amount.trim(),
    useAllAmount: form.useAllAmount || undefined,
    feeStrategy: form.feeStrategy.trim() || undefined,
    customFees: jsonObjectOf("Custom fees", form.customFees),
    feeAssetId: form.feeAssetId.trim() || undefined,
    memo: memoOf(form),
    familyOptions: jsonObjectOf("Family options", form.familyOptions),
  });
  if (parsed.success) return parsed.data;
  throw new ToolRequestError(
    parsed.error.issues.map(issue => `${issue.path.join(".")}: ${issue.message}`).join("\n"),
  );
}

function memoOf(form: ToolRequest): SendRequest["memo"] {
  const value = form.memo.trim();
  const type = form.memoType.trim();
  if (!value) {
    if (type) throw new ToolRequestError("Memo type needs a memo");
    return undefined;
  }
  return type ? { value, type } : { value };
}

const describe = ({ name, field }: TransactionIssue) => (field ? `${name} (${field})` : name);

type SignedEvent = Extract<SendSignEvent, { type: "signed" }>;

const isSigned = (event: SendSignEvent): event is SignedEvent => event.type === "signed";

async function signSimulated(
  sign: (device: SigningDevice) => Observable<SendSignEvent>,
): Promise<SignedSend> {
  const event = await lastValueFrom(sign(SIMULATED_DEVICE).pipe(filter(isSigned)), {
    defaultValue: undefined,
  });
  if (!event) throw new ToolRequestError("Signing ended without a signature");
  return event.signed;
}

/** Only mock accounts sign: real ones need the sign Device Intent, not wired here yet. */
export function useAccountTransactionToolProps(): AccountTransactionToolProps {
  const dispatch = useDispatch<Dispatch>();
  const entries = useSelector(selectAccountEntries);
  const heldAssetIds = useSelector(selectHeldAssetIds, sameHeldAssetIds);
  const preparations = useRef(new Map<string, PreparedSend>());

  const descriptorOf = useCallback(
    (accountUUID: string) => {
      const entry = entries.find(each => each.accountUUID === accountUUID);
      if (!entry) throw new ToolRequestError(`No account ${accountUUID}`);
      return entry.descriptor;
    },
    [entries],
  );

  const accounts = useMemo(
    () =>
      entries.map(({ accountUUID, descriptor }) => {
        const native = nativeAssetIdOf(descriptor.network);
        const held = heldAssetIds[accountUUID] ?? [];
        return {
          accountUUID,
          label: `${descriptor.network} · ${descriptor.purpose}`,
          assetIds: native ? [native, ...held.filter(assetId => assetId !== native)] : held,
          canSign: descriptor.purpose === "mock",
        };
      }),
    [entries, heldAssetIds],
  );

  const onPrepare = useCallback<AccountTransactionToolProps["onPrepare"]>(
    async (accountUUID, form) => {
      const prepared = await dispatch(prepareSend(descriptorOf(accountUUID), sendRequestOf(form)));
      preparations.current.set(prepared.id, prepared);
      return {
        preparationId: prepared.id,
        sourceId: prepared.sourceId,
        amount: prepared.prepared.amount,
        fees: prepared.prepared.fees,
        feeAssetId: prepared.prepared.feeAssetId,
        totalSpent: prepared.prepared.totalSpent,
        errors: prepared.prepared.errors.map(describe),
        warnings: prepared.prepared.warnings.map(describe),
      };
    },
    [dispatch, descriptorOf],
  );

  const onEstimateFees = useCallback<AccountTransactionToolProps["onEstimateFees"]>(
    (accountUUID, form, strategies) =>
      dispatch(estimateSendFees(descriptorOf(accountUUID), sendRequestOf(form), strategies)),
    [dispatch, descriptorOf],
  );

  const onSignAndBroadcast = useCallback<AccountTransactionToolProps["onSignAndBroadcast"]>(
    async preparationId => {
      const prepared = preparations.current.get(preparationId);
      if (!prepared) throw new ToolRequestError("Prepare again: this preparation is gone");
      if (prepared.sourceId !== MOCK_SOURCE_ID) {
        throw new ToolRequestError(
          `Source "${prepared.sourceId}" signs on a device: it needs the sign Device Intent`,
        );
      }
      const signed = await signSimulated(dispatch(signSend(prepared)));
      const broadcasted = await dispatch(broadcastSend(prepared, signed));
      preparations.current.delete(preparationId);
      return { hash: broadcasted.hash, pendingRows: broadcasted.operations.length };
    },
    [dispatch],
  );

  const onRelease = useCallback<AccountTransactionToolProps["onRelease"]>(
    preparationId => {
      const prepared = preparations.current.get(preparationId);
      if (!prepared) return;
      dispatch(releaseSend(prepared));
      preparations.current.delete(preparationId);
    },
    [dispatch],
  );

  return useMemo(
    () => ({ accounts, onPrepare, onEstimateFees, onSignAndBroadcast, onRelease }),
    [accounts, onPrepare, onEstimateFees, onSignAndBroadcast, onRelease],
  );
}
