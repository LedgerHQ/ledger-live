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
import {
  confidentialApi,
  confidentialContext,
  mockSignTypedData,
} from "../../utils/confidentialApi";
import {
  getConfidentialErrorKind,
  type ConfidentialErrorKind,
} from "../../utils/getConfidentialErrorKind";
import { getSessionBalance, setSessionBalance } from "../../utils/sessionBalances";

export type ConfidentialBalancePhase = "idle" | "signing" | "decrypting";

type Props = {
  account: TokenAccount;
};

const shortenAddress = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`;

export function useConfidentialBalanceFooterViewModel({ account }: Props) {
  const currencyId = account.token.parentCurrencyId;
  const underlying = account.token.contractAddress;
  const isSupportedCurrency = CONFIDENTIAL_CURRENCY_IDS.has(currencyId);
  const owner = useSelector(state =>
    accountSelector(state, { accountId: account.parentId }),
  )?.freshAddress;
  const unit = useAccountUnit(account);
  const locale = useSelector(localeSelector);
  const discreet = useDiscreetMode();

  const cached = getSessionBalance(account.id);
  const [balance, setBalance] = useState<ConfidentialBalance | null | undefined>(cached?.balance);
  const [permitExpiresAt, setPermitExpiresAt] = useState(cached?.permitExpiresAt);
  const [phase, setPhase] = useState<ConfidentialBalancePhase>("idle");
  const [error, setError] = useState<ConfidentialErrorKind | null>(null);

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
        confidentialContext,
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
        });
      }
    } catch (e) {
      if (isMounted.current) setError(getConfidentialErrorKind(e));
    }
  }, [account.id, currencyId, owner, underlying]);

  useEffect(() => {
    if (isSupportedCurrency) void load();
  }, [isSupportedCurrency, load]);

  const reveal = useCallback(async () => {
    if (!owner || !balance) return;
    setError(null);
    setPhase("decrypting");
    const signOnDevice: SignTypedData = async typedData => {
      setPhase("signing");
      const signature = await mockSignTypedData(typedData);
      if (isMounted.current) setPhase("decrypting");
      return signature;
    };
    try {
      const permits = await confidentialApi.ensurePermit(
        confidentialContext,
        currencyId,
        owner,
        [balance.pair.wrapper],
        signOnDevice,
      );
      const decrypted = await confidentialApi.revealConfidentialBalance(
        confidentialContext,
        currencyId,
        owner,
        underlying,
        signOnDevice,
      );
      if (!isMounted.current) return;
      const expiresAt = permits[0]?.expiresAt;
      setBalance(decrypted);
      setPermitExpiresAt(expiresAt);
      setSessionBalance(account.id, { balance: decrypted, permitExpiresAt: expiresAt });
    } catch (e) {
      if (isMounted.current) setError(getConfidentialErrorKind(e));
    } finally {
      if (isMounted.current) setPhase("idle");
    }
  }, [account.id, balance, currencyId, owner, underlying]);

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
    onReveal: reveal,
    onRetry: balance === undefined ? load : reveal,
  };
}

export type ConfidentialBalanceFooterViewModel = ReturnType<
  typeof useConfidentialBalanceFooterViewModel
>;
