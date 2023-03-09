// rates update in counter not working - where does it get set?

export const getBitcoinToDogecoinRatesMock = () => {
  //   const expirationTime = new Date().setSeconds(60);

  return JSON.stringify([
    {
      provider: "changelly",
      providerType: "CEX",
      from: "bitcoin",
      to: "dogecoin",
      amountFrom: "1.28089973",
      amountTo: "40000",
      minAmountFrom: "0.0013932",
      maxAmountFrom: "13.78",
      payoutNetworkFees: "100",
      tradeMethod: "float",
      status: "success",
    },
    // Fixed rate not showing: how do we determine whether to show a fixed rate or not
    // {
    //   provider: "changelly",
    //   providerType: "CEX",
    //   from: "bitcoin",
    //   to: "dogecoin",
    //   payoutNetworkFees: "5.25",
    //   amountRequested: "1.28089973",
    //   minAmountFrom: "0.00560000",
    //   maxAmountFrom: "0.52943100",
    //   tradeMethod: "fixed",
    //   rate: "1600",
    //   expirationTime: expirationTime.toString(),
    //   rateId: "changellyFixedBtcToDogeMockedRate1",
    //   status: "success",
    // },
  ]);
};

export const getEthereumToTetherRatesMock = () => {
  return JSON.stringify([
    {
      provider: "oneinch",
      providerType: "DEX",
      providerURL:
        "/platform/1inch/#/1/unified/swap/eth/usdt?sourceTokenAmount=10.135255432293584185",
      from: "ethereum",
      to: "ethereum/erc20/usd_tether__erc20_",
      amountFrom: "10.135255432293584185",
      amountTo: "16359.791055",
      minAmountFrom: "0.0",
      payoutNetworkFees: "0.5",
      tradeMethod: "float",
      status: "success",
    },
    {
      provider: "paraswap",
      providerType: "DEX",
      providerURL:
        "/platform/paraswap/#/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee-0xdac17f958d2ee523a2206206994597c13d831ec7/10.135255432293584185?network=1",
      from: "ethereum",
      to: "ethereum/erc20/usd_tether__erc20_",
      amountFrom: "10.135255432293584185",
      amountTo: "16319.8673942745",
      minAmountFrom: "0.0",
      payoutNetworkFees: "0.0",
      tradeMethod: "float",
      status: "success",
    },
    {
      provider: "changelly",
      providerType: "CEX",
      from: "ethereum",
      to: "ethereum/erc20/usd_tether__erc20_",
      amountFrom: "10.135255432293584185",
      amountTo: "16046.897687",
      minAmountFrom: "0.0219",
      maxAmountFrom: "71335.202365",
      payoutNetworkFees: "5.2500000000000000000000",
      tradeMethod: "float",
      status: "success",
    },
    {
      provider: "changelly",
      providerType: "CEX",
      rateId: "0d(u&4KCHHl$m~JjhpGwQPphgvi$py",
      from: "ethereum",
      to: "ethereum/erc20/usd_tether__erc20_",
      amountFrom: "10.135255432293584185",
      amountTo: "16017.717373",
      rate: "1580.914016485026",
      payoutNetworkFees: "5.25",
      expirationTime: "1677768715000",
      tradeMethod: "fixed",
      status: "success",
    },
  ]);
};

export const getBitcoinToEthereumRatesMock = () => {
  const expirationTime = new Date().setSeconds(60);

  return JSON.stringify([
    {
      provider: "changelly",
      providerType: "CEX",
      from: "bitcoin",
      to: "ethereum",
      amountFrom: "1.28089973",
      amountTo: "17.9",
      minAmountFrom: "0.00094332",
      maxAmountFrom: "1280.97080108",
      payoutNetworkFees: "0.002",
      tradeMethod: "float",
      status: "success",
    },
    {
      provider: "changelly",
      providerType: "CEX",
      rateId: "changellyFixedBtcToEthMockedRate1",
      from: "bitcoin",
      to: "ethereum",
      amountFrom: "1.28089973",
      amountTo: "17.12345678901234567890",
      rate: "13.953589335241",
      payoutNetworkFees: "0.1",
      expirationTime: expirationTime.toString(),
      tradeMethod: "fixed",
      status: "success",
    },
    {
      provider: "cic",
      providerType: "CEX",
      from: "bitcoin",
      to: "ethereum",
      tradeMethod: "fixed",
      errorCode: 201,
      errorMessage: "IP address not supported by cic",
      status: "error",
    },
    {
      provider: "cic",
      providerType: "CEX",
      from: "bitcoin",
      to: "ethereum",
      tradeMethod: "float",
      errorCode: 201,
      errorMessage: "IP address not supported by cic",
      status: "error",
    },
  ]);
};

export const getRatesMock = () => {
  // would be nice to have this dynamic
  return JSON.stringify([
    {
      provider: "changelly",
      providerType: "CEX",
      from: "ethereum",
      to: "bitcoin",
      amountFrom: "0.07107489522957505",
      amountTo: "0.00485576",
      minAmountFrom: "0.0297",
      maxAmountFrom: "18956.01063",
      payoutNetworkFees: "0.0002650000000000000000",
      tradeMethod: "float",
      status: "success",
    },
    {
      provider: "changelly",
      providerType: "CEX",
      from: "ethereum",
      to: "bitcoin",
      amountRequested: "0.07107489522957505",
      minAmountFrom: "0.07980182",
      maxAmountFrom: "99.75226462",
      tradeMethod: "fixed",
      status: "error",
    },
  ]);
};
