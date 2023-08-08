module.exports = [
  {
    id: "providers", // route id
    url: "/providers", // url in express format
    method: "GET", // HTTP method
    variants: [
      {
        id: "success", // variant id
        type: "json", // variant handler id
        options: {
          status: 200, // status to send
          body: [
            {
              provider: "mockProvider1",
              providerType: "CEX",
              from: "ethereum",
              to: "bitcoin",
              amountFrom: "0.038401364250361767",
              amountTo: "0.00233794",
              minAmountFrom: "0.0195",
              maxAmountFrom: "7292.568315",
              payoutNetworkFees: "0.0002310000000000000000",
              tradeMethod: "float",
              status: "success",
            },
            {
              provider: "mockProvider1",
              providerType: "CEX",
              from: "ethereum",
              to: "bitcoin",
              amountRequested: "0.038401364250361767",
              minAmountFrom: "0.05246177",
              maxAmountFrom: "105.00000000",
              tradeMethod: "fixed",
              status: "success",
            },
            {
              provider: "mockProvider2",
              providerType: "CEX",
              from: "ethereum",
              to: "bitcoin",
              amountRequested: "0.038401364250361767",
              minAmountFrom: "0.02",
              maxAmountFrom: "106.00000000",
              tradeMethod: "float",
              status: "success",
            },
            {
              provider: "mockProvider2",
              providerType: "CEX",
              from: "ethereum",
              to: "bitcoin",
              amountRequested: "0.038401364250361767",
              minAmountFrom: "0.02",
              maxAmountFrom: "106.00000000",
              tradeMethod: "fixed",
              status: "error",
            },
          ],
        },
      },
    ],
  },
];
