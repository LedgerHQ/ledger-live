export const rateRoutes = (): object => [
  {
    id: "rate", // route id
    url: "/rate", // url in express format
    method: "POST", // HTTP method
    variants: [
      {
        id: "success", // variant id
        type: "json", // variant handler id
        options: {
          status: 200, // status to send
          body: [
            {
              provider: "changelly",
              providerType: "CEX",
              from: "bitcoin",
              to: "ethereum",
              amountFrom: "0.038401364250361767",
              amountTo: "0.00233794",
              minAmountFrom: "0.0195",
              maxAmountFrom: "7292.568315",
              payoutNetworkFees: "0.0002310000000000000000",
              tradeMethod: "float",
              status: "success",
            },
            {
              provider: "changelly",
              providerType: "CEX",
              from: "bitcoin",
              to: "ethereum",
              amountRequested: "0.038401364250361767",
              minAmountFrom: "0.05246177",
              maxAmountFrom: "105.00000000",
              tradeMethod: "fixed",
              status: "error",
            },
            {
              provider: "cic",
              providerType: "CEX",
              from: "bitcoin",
              to: "ethereum",
              amountFrom: "0.038401364250361767",
              amountTo: "0.00241234",
              minAmountFrom: "0.02",
              maxAmountFrom: "7293",
              payoutNetworkFees: "0.0000910000000000000000",
              tradeMethod: "float",
              status: "success",
            },
          ],
        },
      },
    ],
  },
];
