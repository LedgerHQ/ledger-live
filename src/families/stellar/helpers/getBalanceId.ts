// TODO: update any type
export const getBalanceId = (balance: any) => {
  switch (balance.asset_type) {
    case "native":
      return "native";
    case "liquidity_pool_shares":
      return balance.liquidity_pool_id;
    case "credit_alphanum4":
    case "credit_alphanum12":
      return `${balance.asset_code}:${balance.asset_issuer}`;
    default:
      return null;
  }
};
