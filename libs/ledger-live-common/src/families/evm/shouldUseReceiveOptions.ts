const shouldUseReceiveOptions = (currencyId: string | undefined) =>
  !!(currencyId && ["ethereum/erc20/usd__coin", "ethereum"].includes(currencyId));

export default shouldUseReceiveOptions;
