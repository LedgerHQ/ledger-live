export const referenceSnapshotDate = new Date(1588421046099);
export const BTCtoUSD = 9000;

// Mapping ticker -> [id, value] for mocks with minimal amount of coins
export const TICKER_TO_ID_AND_VALUE: Record<string, [string, number]> = {
  BTC: ["bitcoin", 1],
  ETH: ["ethereum", 0.024148511267564544],
  XRP: ["ripple", 0.000024684982446046028],
  USDT: ["ethereum/erc20/usd_tether__erc20_", 0.00011333520351848443],
  BCH: ["bitcoin_cash", 0.028933931707658213],
  LTC: ["litecoin", 0.005380715375819416],
  XLM: ["stellar", 0.000008137469105171634],
  ETC: ["ethereum_classic", 0.0007604915493071563],
  DOGE: ["dogecoin", 2.8120373022624386e-7],
  DAI: ["ethereum/erc20/dai_stablecoin_v2_0", 0.00011315522800968864],
  USDC: ["hedera/hts/usd_coin_0.0.456858", 0.00011280701598882727],
  BNB: ["bsc", 0.0019705953501713987],
  SOL: ["solana", 6.40585277415653e-8],
  TRX: ["tron", 0.0000018035380709048523],
  ADA: ["cardano", 0.0000057087732441451935],
  XMR: ["monero", 0.007246944505214766],
  ZEC: ["zcash", 0.005159486156331502],
  HBAR: ["hedera", 0.0000050127068035124055],
  AVAX: ["avalanche_c_chain", 0.0000018004678299540296],
  SUI: ["sui", 1.23456789],
  OP: ["optimism", 1.1552422993073057e-7],
  TON: ["ton", 0.0000018004678299540296],
  CRO: ["crypto_org", 0.000006419945986307079],
  NEAR: ["near", 0.0000018004678299540296],
  STETH: ["ethereum/erc20/steth", 0.024148511267564544],
  WBT: ["ethereum/erc20/wbt", 0.00011333520351848443],
  LEO: ["ethereum/erc20/leo_token", 0.00012022458795182462],
  WETH: ["ethereum/erc20/weth", 0.024058325375222334],
  CBTC: ["ethereum/erc20/coinbase_wrapped_btc", 1.0039348484860044],
  BETH: ["bsc/bep20/wrapped_binance_beacon_eth", 0.024148511267564544],
  BUSD: ["bsc/bep20/binance-peg_bsc-usd", 0.00011287304823484806],
  USDE: ["bsc/bep20/usde_0x5d3a1ff2b6bab83b63cd9ad0787074081a52ef34", 0.00011333520351848443],
  WLF: [
    "bsc/bep20/world_liberty_financial_0x47474747477b199288bf72a1d702f7fe0fb1deea",
    0.000004767066430661806,
  ],
  WLSETH: ["linea/erc20/wrapped_liquid_staked_ether_2_0", 0.024148511267564544],
  WEETH: ["linea/erc20/wrapped_eeth", 0.024148511267564544],
  SHIB: ["linea/erc20/shiba_inu", 2.8120373022624386e-7],
  WBTC: ["base/erc20/wrapped_btc_0x0555e30da8f98308edb960aa94c0db47230d2b9c", 1.0039348484860044],
  ICP: ["base/erc20/icp_0x00f3c42833c3170159af4e92dbb451fb3f708917", 0.0000057087732441451935],
  USDS: ["solana/spl/usds_usdswr9apdhk5bvjkmjzff41ffux8bsxdkcr81vtwca", 0.00010765261543724762],
  UNI: ["avalanche_c_chain/erc20/uniswap_(bridged)", 0.00004747081559161075],
  DOT: [
    "optimism/erc20/polkadot_token_relay_chain_0x8d010bf9c26881788b4e6bf5fd1bdc358c8f90b8",
    0.010353326248453618,
  ],
  SUSDE: [
    "arbitrum/erc20/staked_usde_0x211cc4dd073734da055fbf44a2b4667d5e5fe5d2",
    0.00011333520351848443,
  ],
  SAVUSDS: [
    "arbitrum/erc20/savings_usds_0xddb46999f8891663a8f2828d25298f70416d7610",
    0.00010765261543724762,
  ],
  PYUSD: [
    "arbitrum/erc20/paypal_usd_0x46850ad61c2b7d64d08c9c754f45254596696984",
    0.00011333520351848443,
  ],
  MNT: [
    "mantle/erc20/mantle_token_0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000",
    0.0000018004678299540296,
  ],
  LINK: [
    "energi/erc20/chainlink_0x68ca48ca2626c415a89756471d4ade2cc9034008",
    0.0004308891233488705,
  ],
};

// getBTCValues retourne seulement les valeurs filtrées
let parsed: Record<string, number> | undefined;
export const getBTCValues = () => {
  if (parsed) return parsed;
  parsed = {};
  for (const [ticker, [, value]] of Object.entries(TICKER_TO_ID_AND_VALUE)) {
    parsed[ticker] = value;
  }
  return parsed;
};
