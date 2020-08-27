//@flow
import coins from "./erc20";
import erc20 from "./coins";

const raw = [...coins, ...erc20];
const getCurrencyConfigs = () => {
  const configs = {};
  for (const [id, config, signature] of raw) {
    configs[id] = { config, signature };
  }
  return configs;
};

export default getCurrencyConfigs();
