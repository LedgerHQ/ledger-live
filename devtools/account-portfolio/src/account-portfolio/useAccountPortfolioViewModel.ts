import { useState } from "react";
import type {
  AccountPortfolioAction,
  AccountPortfolioView,
  AccountPortfolioTab,
  AccountPortfolioToolProps,
} from "../types";
import { filterByText, isSearchable } from "../utils/filterByText";
import { hideUnknownTokens } from "../utils/hideUnknown";
import { progressOf } from "../utils/portfolioProgress";
import { isJsonArray } from "../utils/jsonArray";
import { ALL_ACCOUNTS, buildRegistration } from "../utils/registration";
import { sortByFiat } from "../utils/sortByFiat";
import { splitList } from "../utils/splitList";
import { useRunHistory } from "../hooks/useRunHistory";
import type { AccountPortfolioViewModel } from "./viewModelTypes";

/**
 * What the result shows: without the unknown tokens if asked, then only what the search matches,
 * then the most valuable first.
 */
function deriveVisibleResult(
  raw: AccountPortfolioView | undefined,
  hideUnknown: boolean,
  search: string,
) {
  const withoutUnknown = hideUnknown && raw ? hideUnknownTokens(raw) : undefined;
  const afterHide = withoutUnknown?.view ?? raw;
  const searched =
    afterHide && isSearchable(afterHide) ? filterByText(afterHide, search) : undefined;
  const visible = searched?.view ?? afterHide;
  return {
    resultView: visible && sortByFiat(visible),
    hiddenCount: withoutUnknown?.hidden ?? 0,
    unmatchedCount: searched?.hidden ?? 0,
    searchable: isSearchable(raw),
  };
}

function nextStepOf(progress: { created: boolean; registered: boolean }) {
  if (!progress.created) return "createPortfolio" as const;
  return progress.registered ? undefined : ("registerAccounts" as const);
}

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

  const runs = useRunHistory(onRun);
  const { history, selected, running } = runs;

  const registration = buildRegistration(accounts, chosen);
  const isCustomPayload = customPayload !== undefined;
  const payload = customPayload ?? registration.payload;
  const payloadValid = isJsonArray(payload);

  const shown = deriveVisibleResult(selected?.result.view, hideUnknown, search);
  const accountWord = registration.count === 1 ? "account" : "accounts";
  const registerLabel = isCustomPayload
    ? "Register this payload"
    : `Register ${registration.count} ${accountWord}`;

  const removeIds = splitList(removeIdsText);
  const addAddresses = splitList(addAddressesText);
  const progress = progressOf(history, portfolioId.trim());
  const nextStep = nextStepOf(progress);
  // The latest successful read of this portfolio. An empty list wins over an older nonempty one.
  const latestPortfolio = history
    .filter(entry => entry.portfolioId === portfolioId.trim() && entry.result.ok)
    .map(entry => entry.result.view)
    .find(candidate => candidate?.kind === "portfolio");
  const listedRegistrations =
    latestPortfolio?.kind === "portfolio" && latestPortfolio.registrationEntries.length > 0
      ? latestPortfolio
      : undefined;

  const run = async (action: AccountPortfolioAction) => {
    // A second click while a call is on its way would send the same call again.
    if (running) return;
    await runs.run({
      action,
      portfolioId: portfolioId.trim(),
      currency: currency.trim() || "usd",
      account: accountFilter.trim() || undefined,
      registrationsJson: payload,
      registrationIds: removeIds,
      addressAccountId: addAccountId.trim(),
      addresses: addAddresses,
      range,
    });
    setSearch("");
    setTab("results");
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
    registerLabel,
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
    canLoadMore: runs.nextHistoryToken !== undefined && !running,
    loadMore: runs.loadMore,
    openRun: id => {
      runs.select(id);
      setTab("results");
    },
    clearHistory: runs.clear,
  };
}
