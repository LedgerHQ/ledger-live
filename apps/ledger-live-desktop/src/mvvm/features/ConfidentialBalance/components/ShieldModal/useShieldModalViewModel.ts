import { useState } from "react";
import BigNumber from "bignumber.js";
import type { TokenAccount } from "@ledgerhq/types-live";
import type { ConfidentialPair } from "@ledgerhq/coin-evm/confidential";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useSelector } from "LLD/hooks/redux";
import { localeSelector } from "~/renderer/reducers/settings";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { confidentialApi, type ConfidentialApi } from "../../utils/confidentialApi";
import {
  createConfidentialContext,
  type CreateConfidentialClient,
} from "../../utils/confidentialRuntime";
import {
  getConfidentialErrorKind,
  type ConfidentialErrorKind,
} from "../../utils/getConfidentialErrorKind";
import { getShieldMaxDecimals, parseShieldAmount } from "../../utils/shieldAmount";
import { getShieldExecutor, type ShieldStep } from "../../utils/shieldExecutor";

export type ShieldPhaseStatus = "pending" | "signing" | "confirming" | "done" | "failed";
export type ShieldPhase = { status: ShieldPhaseStatus; hash?: string };
export type ShieldScreen = "amount" | "progress" | "done";

type PreparedShield = Awaited<ReturnType<ConfidentialApi["prepareShield"]>>;

type Props = {
  account: TokenAccount;
  owner: string;
  pair: ConfidentialPair;
  createConfidentialClient: CreateConfidentialClient;
  onClose: () => void;
  onShielded: () => void;
};

const INITIAL_PHASES: Record<ShieldStep, ShieldPhase> = {
  approve: { status: "pending" },
  wrap: { status: "pending" },
};

const SHIELD_STEPS: ShieldStep[] = ["approve", "wrap"];

const shortenHash = (hash: string) => `${hash.slice(0, 10)}…${hash.slice(-4)}`;

export function useShieldModalViewModel({
  account,
  owner,
  pair,
  createConfidentialClient,
  onClose,
  onShielded,
}: Props) {
  const unit = useAccountUnit(account);
  const locale = useSelector(localeSelector);
  const currencyId = account.token.parentCurrencyId;

  const [input, setInput] = useState("");
  const [screen, setScreen] = useState<ShieldScreen>("amount");
  const [phases, setPhases] = useState(INITIAL_PHASES);
  const [error, setError] = useState<ConfidentialErrorKind | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [prepared, setPrepared] = useState<PreparedShield | null>(null);

  const parsed = parseShieldAmount(input, unit.magnitude, pair.rate, account.balance);
  const formatAmount = (value: bigint) =>
    formatCurrencyUnit(unit, new BigNumber(value.toString()), {
      alwaysShowSign: false,
      showCode: true,
      locale,
    });

  const updatePhase = (step: ShieldStep, phase: ShieldPhase) =>
    setPhases(current => ({ ...current, [step]: phase }));

  const runFrom = async (shield: PreparedShield, completed: Record<ShieldStep, ShieldPhase>) => {
    const executor = getShieldExecutor();
    for (const [index, step] of SHIELD_STEPS.entries()) {
      if (completed[step].status === "done") continue;
      updatePhase(step, { status: "signing" });
      let hash: string | undefined;
      try {
        hash = await executor.signAndBroadcast(step, shield.transactions[index]);
        updatePhase(step, { status: "confirming", hash });
        await executor.waitForConfirmation(hash);
        updatePhase(step, { status: "done", hash });
      } catch (e) {
        updatePhase(step, { status: "failed", hash });
        setError(getConfidentialErrorKind(e));
        return;
      }
    }
    setScreen("done");
    onShielded();
  };

  const submit = async () => {
    if (parsed.amount === undefined) return;
    setError(null);
    setIsPreparing(true);
    try {
      const shield = await confidentialApi.prepareShield(
        createConfidentialContext(currencyId, createConfidentialClient),
        currencyId,
        { sender: owner, underlying: account.token.contractAddress, amount: parsed.amount },
      );
      setPrepared(shield);
      setPhases(INITIAL_PHASES);
      setScreen("progress");
      await runFrom(shield, INITIAL_PHASES);
    } catch (e) {
      setError(getConfidentialErrorKind(e));
    } finally {
      setIsPreparing(false);
    }
  };

  const retry = async () => {
    if (!prepared) return;
    setError(null);
    await runFrom(prepared, phases);
  };

  const isRunning = SHIELD_STEPS.some(
    step => phases[step].status === "signing" || phases[step].status === "confirming",
  );
  const amountPulled = prepared?.amountPulled;
  const remainder = prepared?.remainder;

  return {
    screen,
    input,
    maxDecimals: getShieldMaxDecimals(unit.magnitude, pair.rate),
    ticker: account.token.ticker,
    wrapper: `${pair.wrapper.slice(0, 6)}…${pair.wrapper.slice(-4)}`,
    publicLabel: formatAmount(BigInt(account.balance.toFixed(0))),
    amountError: parsed.error ?? null,
    canSubmit: parsed.amount !== undefined && !isPreparing,
    isPreparing,
    isRunning,
    phases: SHIELD_STEPS.map(step => ({
      step,
      status: phases[step].status,
      hash: phases[step].hash ? shortenHash(phases[step].hash) : undefined,
    })),
    error,
    shieldedLabel: amountPulled !== undefined ? formatAmount(amountPulled) : undefined,
    remainderLabel: remainder ? formatAmount(remainder) : undefined,
    onChangeInput: setInput,
    onMax: () => setInput(account.balance.shiftedBy(-unit.magnitude).toFixed()),
    onSubmit: submit,
    onRetry: screen === "amount" ? submit : retry,
    onClose,
  };
}

export type ShieldModalViewModel = ReturnType<typeof useShieldModalViewModel>;
