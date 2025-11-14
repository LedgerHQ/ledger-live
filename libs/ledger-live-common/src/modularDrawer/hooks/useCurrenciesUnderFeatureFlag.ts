import { useMemo } from "react";
import { CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
import { Feature } from "@ledgerhq/types-live";
import { useFeature } from "../../featureFlags";
import useEnv from "../../hooks/useEnv";

export function useCurrenciesUnderFeatureFlag() {
  const mock = useEnv("MOCK");

  const aptos = useFeature("currencyAptos");
  const aptosTestnet = useFeature("currencyAptosTestnet");
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
  const xion = useFeature("currencyXion");
  const zenrock = useFeature("currencyZenrock");
  const sonic = useFeature("currencySonic");
  const sonicBlaze = useFeature("currencySonicBlaze");
  const sui = useFeature("currencySui");
  const mina = useFeature("currencyMina");
  const babylon = useFeature("currencyBabylon");
  const seiNetworkEvm = useFeature("currencySeiNetworkEvm");
  const berachain = useFeature("currencyBerachain");
  const hyperevm = useFeature("currencyHyperevm");
  const canton = useFeature("currencyCantonNetwork");
  const cantonDevnet = useFeature("currencyCantonNetworkDevnet");
  const cantonTestnet = useFeature("currencyCantonNetworkTestnet");
  const kaspa = useFeature("currencyKaspa");
  const core = useFeature("currencyCore");
  const ethereumHoodi = useFeature("currencyEthereumHoodi");
  const westend = useFeature("currencyWestend");
  const assetHubWestend = useFeature("currencyAssetHubWestend");
  const assetHubPolkadot = useFeature("currencyAssetHubPolkadot");
  const polkadot = useFeature("currencyPolkadot");
  const monad = useFeature("currencyMonad");
  const somnia = useFeature("currencySomnia");
  const zeroGravity = useFeature("currencyZeroGravity");

  const featureFlaggedCurrencies = useMemo(
    (): Partial<Record<CryptoCurrencyId, Feature<unknown> | null>> => ({
      aptos,
      aptos_testnet: aptosTestnet,
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
      sei_network_evm: seiNetworkEvm,
      berachain: berachain,
      hyperevm: hyperevm,
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
      xion,
      zenrock,
      sonic,
      sonic_blaze: sonicBlaze,
      sui,
      mina,
      babylon,
      canton_network: canton,
      canton_network_devnet: cantonDevnet,
      canton_network_testnet: cantonTestnet,
      kaspa,
      core,
      ethereum_hoodi: ethereumHoodi,
      westend,
      assethub_westend: assetHubWestend,
      assethub_polkadot: assetHubPolkadot,
      polkadot,
      monad,
      somnia,
      zero_gravity: zeroGravity,
    }),
    [
      aptos,
      aptosTestnet,
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
      seiNetworkEvm,
      berachain,
      hyperevm,
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
      xion,
      zenrock,
      sonic,
      sonicBlaze,
      sui,
      mina,
      babylon,
      canton,
      kaspa,
      core,
      ethereumHoodi,
      westend,
      assetHubWestend,
      assetHubPolkadot,
      polkadot,
      monad,
      somnia,
      zeroGravity,
    ],
  );

  const deactivatedCurrencyIds = useMemo(
    () =>
      new Set(
        mock
          ? [] // mock mode: all currencies are available for playwrigth tests
          : Object.entries(featureFlaggedCurrencies)
              .filter(([, feature]) => !feature?.enabled)
              .map(([id]) => id),
      ),
    [mock, featureFlaggedCurrencies],
  );
  return {
    featureFlaggedCurrencies,
    deactivatedCurrencyIds,
  };
}
