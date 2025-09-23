const ShouldUseReceiveOptions = (accountCurrencyId: string | undefined) =>
  !!(accountCurrencyId && ["ethereum/erc20/usd__coin", "ethereum"].includes(accountCurrencyId));

export default ShouldUseReceiveOptions;
