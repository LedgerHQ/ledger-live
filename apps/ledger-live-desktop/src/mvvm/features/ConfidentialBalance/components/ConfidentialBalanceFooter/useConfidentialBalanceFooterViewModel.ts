import { useCallback, useEffect, useRef, useState } from "react";
import BigNumber from "bignumber.js";
import type { TokenAccount } from "@ledgerhq/types-live";
import type { ConfidentialBalance, SignTypedData } from "@ledgerhq/coin-evm/confidential";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useSelector } from "LLD/hooks/redux";
import { accountSelector } from "~/renderer/reducers/accounts";
import { localeSelector } from "~/renderer/reducers/settings";
import { useDiscreetMode } from "~/renderer/components/Discreet";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { CONFIDENTIAL_CURRENCY_IDS, PERMIT_VALIDITY_DAYS } from "../../constants";
import { confidentialApi } from "../../utils/confidentialApi";
import {
  createConfidentialContext,
  type CreateConfidentialClient,
} from "../../utils/confidentialRuntime";
import { usePendingUnshield } from "../../hooks/usePendingUnshield";
import { usePermitSigner } from "../../hooks/usePermitSigner";
import {
  getConfidentialErrorKind,
  type ConfidentialErrorKind,
} from "../../utils/getConfidentialErrorKind";
import { registerConfidentialSendRuntime } from "../../utils/confidentialSendRuntime";
import { getSessionBalance, setSessionBalance } from "../../utils/sessionBalances";

export type ConfidentialBalancePhase = "idle" | "signing" | "decrypting" | "waiting";

/** Delays between automatic reveal retries while the network has not processed the balance yet. */
export const REVEAL_RETRY_DELAYS_MS = [4_000, 10_000, 30_000, 60_000];

type Props = {
  account: TokenAccount;
  createConfidentialClient: CreateConfidentialClient;
};

const shortenAddress = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`;

export function useConfidentialBalanceFooterViewModel({
  account,
  createConfidentialClient,
}: Props) {
  const currencyId = account.token.parentCurrencyId;
  const underlying = account.token.contractAddress;
  const isSupportedCurrency = CONFIDENTIAL_CURRENCY_IDS.has(currencyId);
  const parentAccount = useSelector(state =>
    accountSelector(state, { accountId: account.parentId }),
  );
  const owner = parentAccount?.freshAddress;
  const { signTypedData, signTransaction, deviceSignature } = usePermitSigner(parentAccount);
  const unit = useAccountUnit(account);
  const locale = useSelector(localeSelector);
  const discreet = useDiscreetMode();

  const cached = getSessionBalance(account.id);
  const [balance, setBalance] = useState<ConfidentialBalance | null | undefined>(cached?.balance);
  const [permitExpiresAt, setPermitExpiresAt] = useState(cached?.permitExpiresAt);
  const [phase, setPhase] = useState<ConfidentialBalancePhase>("idle");
  const [error, setError] = useState<ConfidentialErrorKind | null>(null);

  useEffect(() => {
    if (isSupportedCurrency) registerConfidentialSendRuntime(createConfidentialClient);
  }, [createConfidentialClient, isSupportedCurrency]);

  const isMounted = useRef(true);
  useEffect(
    () => () => {
      isMounted.current = false;
    },
    [],
  );

  const load = useCallback(async () => {
    if (!owner) return;
    try {
      const cachedEntry = getSessionBalance(account.id);
      const next = await confidentialApi.getConfidentialBalance(
        createConfidentialContext(currencyId, createConfidentialClient),
        currencyId,
        owner,
        underlying,
        cachedEntry?.balance,
      );
      if (!isMounted.current) return;
      setBalance(next);
      setError(null);
      if (next) {
        setSessionBalance(account.id, {
          balance: next,
          permitExpiresAt: cachedEntry?.permitExpiresAt,
          owner,
        });
      }
    } catch (e) {
      if (isMounted.current) setError(getConfidentialErrorKind(e));
    }
  }, [account.id, createConfidentialClient, currencyId, owner, underlying]);

  useEffect(() => {
    if (isSupportedCurrency) void load();
  }, [isSupportedCurrency, load]);

  // A handle the coprocessors have not attested yet is not unreadable: retry on a growing delay
  // (the relayer's own Retry-After steps) until it decrypts or fails for another reason.
  const retryTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const retryAttempt = useRef(0);
  useEffect(() => () => clearTimeout(retryTimer.current), []);

  const reveal = useCallback(async (): Promise<void> => {
    if (!owner || !balance) return;
    clearTimeout(retryTimer.current);
    setError(null);
    setPhase("decrypting");
    const signOnDevice: SignTypedData = async typedData => {
      setPhase("signing");
      const signature = await signTypedData(typedData);
      if (isMounted.current) setPhase("decrypting");
      return signature;
    };
    try {
      const context = createConfidentialContext(currencyId, createConfidentialClient);
      const permits = await confidentialApi.ensurePermit(
        context,
        currencyId,
        owner,
        [balance.pair.wrapper],
        signOnDevice,
      );
      const decrypted = await confidentialApi.revealConfidentialBalance(
        context,
        currencyId,
        owner,
        underlying,
        signOnDevice,
      );
      if (!isMounted.current) return;
      const expiresAt = permits[0]?.expiresAt;
      setBalance(decrypted);
      setPermitExpiresAt(expiresAt);
      setSessionBalance(account.id, { balance: decrypted, permitExpiresAt: expiresAt, owner });
      retryAttempt.current = 0;
      setPhase("idle");
    } catch (e) {
      if (!isMounted.current) return;
      const kind = getConfidentialErrorKind(e);
      if (kind === "decryptionPending") {
        const delay =
          REVEAL_RETRY_DELAYS_MS[Math.min(retryAttempt.current, REVEAL_RETRY_DELAYS_MS.length - 1)];
        retryAttempt.current += 1;
        setPhase("waiting");
        retryTimer.current = setTimeout(() => void revealRef.current(), delay);
        return;
      }
      retryAttempt.current = 0;
      setError(kind);
      setPhase("idle");
    }
  }, [account.id, balance, createConfidentialClient, currencyId, owner, signTypedData, underlying]);

  // The retry calls the latest reveal, whose dependencies may have changed meanwhile.
  const revealRef = useRef(reveal);
  useEffect(() => {
    revealRef.current = reveal;
  }, [reveal]);

  const pendingUnshield = usePendingUnshield({
    tokenAccountId: account.id,
    currencyId,
    pair: balance?.pair,
    createConfidentialClient,
    signTransaction,
    onFinalized: load,
  });

  const formatAmount = (value: BigNumber) =>
    formatCurrencyUnit(unit, value, {
      alwaysShowSign: false,
      showCode: true,
      discreet,
      locale,
    });

  const privateValue =
    balance && balance.state !== "undisclosed"
      ? new BigNumber(balance.underlyingValue.toString())
      : undefined;

  return {
    isVisible:
      isSupportedCurrency && (Boolean(balance) || (balance === undefined && error !== null)),
    phase,
    error,
    state: balance?.state,
    wrapper: balance ? shortenAddress(balance.pair.wrapper) : undefined,
    permitValidityDays: PERMIT_VALIDITY_DAYS,
    publicLabel: formatAmount(account.balance),
    privateLabel:
      balance?.state === "decrypted" && privateValue ? formatAmount(privateValue) : undefined,
    lastRevealedLabel:
      balance?.state === "stale" && privateValue ? formatAmount(privateValue) : undefined,
    totalLabel:
      balance?.state === "decrypted" && privateValue
        ? formatAmount(account.balance.plus(privateValue))
        : undefined,
    permitExpiresOn: permitExpiresAt
      ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(permitExpiresAt * 1000)
      : undefined,
    deviceSignature,
    unshield:
      pendingUnshield && balance
        ? {
            ...pendingUnshield,
            amountLabel: formatAmount(
              new BigNumber((pendingUnshield.amount * balance.pair.rate).toString()),
            ),
          }
        : null,
    onReveal: reveal,
    onRetry: balance === undefined ? load : reveal,
  };
}

export type ConfidentialBalanceFooterViewModel = ReturnType<
  typeof useConfidentialBalanceFooterViewModel
>;
