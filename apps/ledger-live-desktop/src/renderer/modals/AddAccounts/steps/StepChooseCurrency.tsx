import React, { useMemo, useCallback } from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  listSupportedCurrencies,
  listTokens,
  isCurrencySupported,
} from "@ledgerhq/live-common/currencies/index";
import { findTokenAccountByCurrency } from "@ledgerhq/live-common/account/index";
import { supportLinkByTokenType } from "~/config/urls";
import TrackPage from "~/renderer/analytics/TrackPage";
import SelectCurrency from "~/renderer/components/SelectCurrency";
import Button from "~/renderer/components/Button";
import Box from "~/renderer/components/Box";
import CurrencyBadge from "~/renderer/components/CurrencyBadge";
import Alert from "~/renderer/components/Alert";
import CurrencyDownStatusAlert from "~/renderer/components/CurrencyDownStatusAlert";
import { StepProps } from "..";
import { useDispatch } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import FullNodeStatus from "~/renderer/modals/AddAccounts/FullNodeStatus";
import useSatStackStatus from "~/renderer/hooks/useSatStackStatus";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
// TODO move to bitcoin family
// eslint-disable-next-line no-restricted-imports
import { SatStackStatus } from "@ledgerhq/live-common/families/bitcoin/satstack";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { NetworkDown } from "@ledgerhq/errors";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import { CryptoCurrencyId, CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Feature } from "@ledgerhq/types-live";

const listSupportedTokens = () =>
  listTokens().filter(token => isCurrencySupported(token.parentCurrency));

const StepChooseCurrency = ({ currency, setCurrency }: StepProps) => {
  const mock = useEnv("MOCK");

  const axelar = useFeature("currencyAxelar");
  const stargaze = useFeature("currencyStargaze");
  const secretNetwork = useFeature("currencySecretNetwork");
  const umee = useFeature("currencyUmee");
  const desmos = useFeature("currencyDesmos");
  const dydx = useFeature("currencyDydx");
  const onomy = useFeature("currencyOnomy");
  const seiNetwork = useFeature("currencySeiNetwork");
  const quicksilver = useFeature("currencyQuicksilver");
  const persistence = useFeature("currencyPersistence");
  const avaxCChain = useFeature("currencyAvalancheCChain");
  const stacks = useFeature("currencyStacks");
  const optimism = useFeature("currencyOptimism");
  const optimismSepolia = useFeature("currencyOptimismSepolia");
  const arbitrum = useFeature("currencyArbitrum");
  const arbitrumSepolia = useFeature("currencyArbitrumSepolia");
  const rsk = useFeature("currencyRsk");
  const bittorrent = useFeature("currencyBittorrent");
  const energyWeb = useFeature("currencyEnergyWeb");
  const astar = useFeature("currencyAstar");
  const metis = useFeature("currencyMetis");
  const boba = useFeature("currencyBoba");
  const moonriver = useFeature("currencyMoonriver");
  const velasEvm = useFeature("currencyVelasEvm");
  const syscoin = useFeature("currencySyscoin");
  const internetComputer = useFeature("currencyInternetComputer");
  const telosEvm = useFeature("currencyTelosEvm");
  const coreum = useFeature("currencyCoreum");
  const polygonZkEvm = useFeature("currencyPolygonZkEvm");
  const polygonZkEvmTestnet = useFeature("currencyPolygonZkEvmTestnet");
  const base = useFeature("currencyBase");
  const baseSepolia = useFeature("currencyBaseSepolia");
  const klaytn = useFeature("currencyKlaytn");
  const injective = useFeature("currencyInjective");
  const vechain = useFeature("currencyVechain");
  const casper = useFeature("currencyCasper");
  const neonEvm = useFeature("currencyNeonEvm");
  const lukso = useFeature("currencyLukso");
  const linea = useFeature("currencyLinea");
  const lineaSepolia = useFeature("currencyLineaSepolia");
  const blast = useFeature("currencyBlast");
  const blastSepolia = useFeature("currencyBlastSepolia");
  const scroll = useFeature("currencyScroll");
  const scrollSepolia = useFeature("currencyScrollSepolia");
  const icon = useFeature("currencyIcon");
  const ton = useFeature("currencyTon");
  const etherlink = useFeature("currencyEtherlink");
  const zksync = useFeature("currencyZkSync");
  const zksyncSepolia = useFeature("currencyZkSyncSepolia");
  const mantra = useFeature("currencyMantra");
  const cryptoOrg = useFeature("currencyCryptoOrg");

  const featureFlaggedCurrencies = useMemo(
    (): Partial<Record<CryptoCurrencyId, Feature<unknown> | null>> => ({
      axelar,
      stargaze,
      secret_network: secretNetwork,
      umee,
      desmos,
      dydx,
      onomy,
      sei_network: seiNetwork,
      quicksilver,
      persistence,
      avalanche_c_chain: avaxCChain,
      stacks,
      optimism,
      optimism_sepolia: optimismSepolia,
      arbitrum,
      arbitrum_sepolia: arbitrumSepolia,
      rsk,
      bittorrent,
      energy_web: energyWeb,
      astar,
      metis,
      boba,
      moonriver,
      velas_evm: velasEvm,
      syscoin,
      internet_computer: internetComputer,
      telos_evm: telosEvm,
      coreum,
      polygon_zk_evm: polygonZkEvm,
      polygon_zk_evm_testnet: polygonZkEvmTestnet,
      base,
      base_sepolia: baseSepolia,
      klaytn,
      injective,
      vechain,
      casper,
      neon_evm: neonEvm,
      lukso,
      linea,
      ton,
      linea_sepolia: lineaSepolia,
      blast,
      blast_sepolia: blastSepolia,
      scroll,
      scroll_sepolia: scrollSepolia,
      icon,
      etherlink,
      zksync,
      zksync_sepolia: zksyncSepolia,
      mantra,
      crypto_org_cosmos: cryptoOrg,
    }),
    [
      axelar,
      stargaze,
      secretNetwork,
      umee,
      desmos,
      dydx,
      onomy,
      seiNetwork,
      quicksilver,
      persistence,
      avaxCChain,
      stacks,
      optimism,
      optimismSepolia,
      arbitrum,
      arbitrumSepolia,
      rsk,
      bittorrent,
      energyWeb,
      astar,
      metis,
      boba,
      moonriver,
      velasEvm,
      syscoin,
      internetComputer,
      telosEvm,
      coreum,
      polygonZkEvm,
      polygonZkEvmTestnet,
      base,
      baseSepolia,
      klaytn,
      injective,
      vechain,
      casper,
      neonEvm,
      lukso,
      linea,
      ton,
      lineaSepolia,
      blast,
      blastSepolia,
      scroll,
      scrollSepolia,
      icon,
      etherlink,
      zksync,
      zksyncSepolia,
      mantra,
      cryptoOrg,
    ],
  );

  const currencies = useMemo(() => {
    const supportedCurrenciesAndTokens = (
      listSupportedCurrencies() as CryptoOrTokenCurrency[]
    ).concat(listSupportedTokens());

    const deactivatedCurrencyIds = new Set(
      mock
        ? [] // mock mode: all currencies are available for playwrigth tests
        : Object.entries(featureFlaggedCurrencies)
            .filter(([, feature]) => !feature?.enabled)
            .map(([id]) => id),
    );

    return supportedCurrenciesAndTokens.filter(
      c =>
        (c.type === "CryptoCurrency" && !deactivatedCurrencyIds.has(c.id)) ||
        (c.type === "TokenCurrency" && !deactivatedCurrencyIds.has(c.parentCurrency.id)),
    );
  }, [featureFlaggedCurrencies, mock]);

  const url =
    currency && currency.type === "TokenCurrency"
      ? supportLinkByTokenType[currency.tokenType as keyof typeof supportLinkByTokenType]
      : null;

  return (
    <>
      {!navigator.onLine ? (
        <div>
          <ErrorBanner error={new NetworkDown()} />
        </div>
      ) : currency ? (
        <CurrencyDownStatusAlert currencies={[currency]} />
      ) : null}
      <SelectCurrency currencies={currencies} autoFocus onChange={setCurrency} value={currency} />
      <FullNodeStatus currency={currency} />
      {currency && currency.type === "TokenCurrency" ? (
        <Alert type="primary" learnMoreUrl={url} mt={4} data-testid="add-token-infoBox">
          <Trans
            i18nKey="addAccounts.tokensTip"
            values={{
              token: currency.name,
              ticker: currency.ticker,
              tokenType: currency.tokenType.toUpperCase(),
              currency: currency.parentCurrency.name,
            }}
          >
            <b></b>
          </Trans>
        </Alert>
      ) : null}
    </>
  );
};

export const StepChooseCurrencyFooter = ({
  transitionTo,
  currency,
  existingAccounts,
  onCloseModal,
  setCurrency,
}: StepProps) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const isToken = currency && currency.type === "TokenCurrency";
  const satStackAlreadyConfigured = useEnv("SATSTACK");
  const latestStatus: SatStackStatus | undefined | null = useSatStackStatus();
  const fullNodeNotReady =
    satStackAlreadyConfigured &&
    !!(
      currency &&
      currency.type === "CryptoCurrency" &&
      currency.id === "bitcoin" &&
      latestStatus &&
      latestStatus.type !== "ready"
    );

  const parentCurrency = isToken && currency.parentCurrency;

  const accountData = isToken && findTokenAccountByCurrency(currency, existingAccounts);
  const parentTokenAccount = accountData ? accountData.parentAccount : null;
  const tokenAccount = accountData ? accountData.account : null;

  // specific cta in case of token accounts
  const onTokenCta = useCallback(() => {
    if (parentTokenAccount) {
      onCloseModal();
      dispatch(
        openModal(
          "MODAL_RECEIVE",
          tokenAccount // if already has token receive directly to it
            ? {
                account: tokenAccount,
                parentAccount: parentTokenAccount,
              }
            : {
                account: parentTokenAccount, // else receive to parent account
              },
        ),
      );
    } else if (parentCurrency) {
      // set parentCurrency in already opened add account flow and continue
      setCurrency(parentCurrency);
      transitionTo("connectDevice");
    }
  }, [
    parentTokenAccount,
    parentCurrency,
    onCloseModal,
    dispatch,
    setCurrency,
    tokenAccount,
    transitionTo,
  ]);

  return (
    <>
      <TrackPage category="AddAccounts" name="Step1" />
      {currency && <CurrencyBadge currency={currency} />}
      {isToken ? (
        <Box horizontal>
          {parentCurrency ? (
            <Button
              ml={2}
              primary
              onClick={onTokenCta}
              data-testid="modal-continue-button"
              style={{ wordBreak: "break-word", maxWidth: "170px" }}
            >
              {parentTokenAccount
                ? t("addAccounts.cta.receive")
                : t("addAccounts.cta.addAccountName", {
                    currencyName: parentCurrency.name,
                  })}
            </Button>
          ) : null}
        </Box>
      ) : (
        <Button
          primary
          disabled={!currency || fullNodeNotReady || !navigator.onLine}
          onClick={() => transitionTo("connectDevice")}
          data-testid="modal-continue-button"
        >
          {t("common.continue")}
        </Button>
      )}
    </>
  );
};

export default StepChooseCurrency;
