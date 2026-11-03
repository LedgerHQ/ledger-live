const NON_TRANSFERABLE_TOKEN_IDS = new Set([
  "ethereum/erc20/pooled_staked_eth",
  "ethereum/erc20/lc_staked_shared_eth_0xc4dcb059dd98b45b090da8982234c61d0b9e84f9",
  "ethereum/erc20/yield_bearing_aave_usdt_0x4d431856295413906075dd40266d83624e09c672",
  "ethereum/erc20/yield_bearing_aave_usdc_0xd2011d314acaa68e5401e7f5aec3be6d2c574dcf",
  "ethereum/erc20/yield_bearing_aave_dai_0x4ef971774c77865ff8ec35f274474cb0ed9c48fa",
  "ethereum/erc20/yield_bearing_aave_usds_0xd88714e295da03a07bcb8ad4a4dbe87fa42d75f9",
  "ethereum/erc20/yield_bearing_angle_usda_0x4b20748c3dd973f1456eccde4ff84d54792dcd3e",
]);

export const isNonTransferableToken = (currency: { id: string }): boolean =>
  NON_TRANSFERABLE_TOKEN_IDS.has(currency.id);
