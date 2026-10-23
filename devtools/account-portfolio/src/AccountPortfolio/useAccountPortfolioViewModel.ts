import { useRef, useState } from "react";
import type {
  AccountPortfolioAction,
  AccountPortfolioTab,
  AccountPortfolioToolProps,
  Run,
} from "../types";
import { filterByText, isSearchable } from "../utils/filterByText";
import { hideUnknownTokens } from "../utils/hideUnknown";
import { progressOf } from "../utils/progress";
import { isJsonArray } from "../utils/json";
import { ALL_ACCOUNTS, buildRegistration } from "../utils/registration";
import { sortByFiat } from "../utils/sortByFiat";
import { splitList } from "../utils/splitList";
import { useNetworkForm } from "./hooks/useNetworkForm";
import { useWriteForm } from "./hooks/useWriteForm";
import type { AccountPortfolioViewModel } from "./types";

const HISTORY_SIZE = 50;

/**
 * The state and the handlers of the tool. The view receives all of it as props and never calls the
 * host: the host's side is `onRun`, built by `useAccountPortfolioToolProps` in `@devtools/bindings`.
 */
export function useAccountPortfolioViewModel({
  accounts,
  defaultPortfolioId,
  serviceUrl,
  onRun,
}: AccountPortfolioToolProps): AccountPortfolioViewModel {
  const [portfolioId, setPortfolioId] = useState(defaultPortfolioId);
  const [currency, setCurrency] = useState("usd");
  const [chosen, setChosen] = useState(ALL_ACCOUNTS);
  const [customPayload, setCustomPayload] = useState<string>();
  const [accountFilter, setAccountFilter] = useState("");
  const [hideUnknown, setHideUnknown] = useState(false);
  const [range, setRange] = useState("day");
  const [editingContext, setEditingContext] = useState(false);
  const [search, setSearch] = useState("");
  const [removeIdsText, setRemoveIdsText] = useState("");
  const [addAccountId, setAddAccountId] = useState("");
  const [addAddressesText, setAddAddressesText] = useState("");
  const [tab, setTab] = useState<AccountPortfolioTab>("portfolio");
  const [running, setRunning] = useState<AccountPortfolioAction>();
  const [history, setHistory] = useState<Run[]>([]);
  const [selectedId, setSelectedId] = useState<number>();
  const nextRunId = useRef(0);

  const networkForm = useNetworkForm();
  const writeForm = useWriteForm(networkForm.network);

  const registration = buildRegistration(accounts, chosen);
  const isCustomPayload = customPayload !== undefined;
  const payload = customPayload ?? registration.payload;
  const payloadValid = isJsonArray(payload);

  const selected = history.find(entry => entry.id === selectedId) ?? history[0];
  // What the result shows: without the unknown tokens if asked, then only what the search matches,
  // then the most valuable first.
  const raw = selected?.result.view;
  const withoutUnknown = hideUnknown && raw ? hideUnknownTokens(raw) : undefined;
  const afterHide = withoutUnknown?.view ?? raw;
  const searched =
    afterHide && isSearchable(afterHide) ? filterByText(afterHide, search) : undefined;
  const visible = searched?.view ?? afterHide;
  const shown = {
    resultView: visible && sortByFiat(visible),
    hiddenCount: withoutUnknown?.hidden ?? 0,
    unmatchedCount: searched?.hidden ?? 0,
    searchable: isSearchable(raw),
  };

  const removeIds = splitList(removeIdsText);
  const addAddresses = splitList(addAddressesText);
  const progress = progressOf(history, portfolioId.trim());
  const nextStep = !progress.created
    ? ("createPortfolio" as const)
    : progress.registered
      ? undefined
      : ("registerAccounts" as const);
  // The latest successful read of this portfolio that listed registrations.
  const listedRegistrations = history
    .filter(entry => entry.portfolioId === portfolioId.trim() && entry.result.ok)
    .map(entry => entry.result.view)
    .find(candidate => candidate?.kind === "portfolio" && candidate.registrationEntries.length > 0);

  const run = async (action: AccountPortfolioAction) => {
    // Broadcasting cannot be taken back: it never runs on a click the user did not confirm.
    if (action === "broadcastTransaction" && !writeForm.confirmBroadcast) return;
    setRunning(action);
    const result = await onRun({
      action,
      portfolioId: portfolioId.trim(),
      currency: currency.trim() || "usd",
      account: accountFilter.trim() || undefined,
      registrationsJson: payload,
      registrationIds: removeIds,
      addressAccountId: addAccountId.trim(),
      addresses: addAddresses,
      range,
      ...networkForm.networkFields,
      ...writeForm.writeFields,
    });
    nextRunId.current += 1;
    const entry: Run = {
      id: nextRunId.current,
      action,
      portfolioId: portfolioId.trim(),
      at: new Date().getTime(),
      result,
    };
    setHistory(previous => [entry, ...previous].slice(0, HISTORY_SIZE));
    setSelectedId(entry.id);
    setSearch("");
    setTab("results");
    setRunning(undefined);
    // Each broadcast needs its own confirmation.
    if (action === "broadcastTransaction") writeForm.setConfirmBroadcast(false);
  };

  return {
    serviceUrl,
    portfolioId,
    setPortfolioId,
    currency,
    setCurrency,
    hasAccounts: accounts.length > 0,
    accountItems: [
      { value: ALL_ACCOUNTS, label: `All accounts (${accounts.length})` },
      ...accounts.map(a => ({
        value: a.accountUUID,
        label: a.label,
        description: a.accountUUID,
      })),
    ],
    chosen,
    choose: accountUUID => {
      setChosen(accountUUID);
      setCustomPayload(undefined);
    },
    payload,
    payloadValid,
    isCustomPayload,
    setCustomPayload,
    resetPayload: () => setCustomPayload(undefined),
    canRegister: payloadValid && (isCustomPayload || registration.count > 0),
    registerLabel: isCustomPayload
      ? "Register this payload"
      : `Register ${registration.count} account${registration.count === 1 ? "" : "s"}`,
    accountFilter,
    setAccountFilter,
    running,
    blocked: running !== undefined || !serviceUrl,
    portfolioMissing: portfolioId.trim() === "",
    // Without an id nothing can run, so the fields stay open until there is one.
    contextOpen: editingContext || portfolioId.trim() === "",
    setContextOpen: setEditingContext,
    range,
    setRange,
    ...networkForm,
    ...writeForm,
    run,
    history,
    tab,
    setTab,
    progress,
    nextStep,
    removeIdsText,
    setRemoveIdsText,
    removeCount: removeIds.length,
    canRemove: removeIds.length > 0,
    canFillRemoveIds: listedRegistrations !== undefined,
    fillRemoveIds: () => {
      if (listedRegistrations?.kind === "portfolio") {
        setRemoveIdsText(listedRegistrations.registrationEntries.map(entry => entry.id).join("\n"));
      }
    },
    addAccountId,
    setAddAccountId,
    addAddressesText,
    setAddAddressesText,
    addAddressesCount: addAddresses.length,
    canAddAddresses: addAccountId.trim() !== "" && addAddresses.length > 0,
    hideUnknown,
    setHideUnknown,
    search,
    setSearch,
    ...shown,
    selected,
    openRun: id => {
      setSelectedId(id);
      setTab("results");
    },
    clearHistory: () => {
      setHistory([]);
      setSelectedId(undefined);
    },
  };
}
