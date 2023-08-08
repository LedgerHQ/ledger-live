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
          body: {
            currencies: {
              8: "bitcoin",
              143: "ethereum",
              7: "ethereum/erc20/usd_tether__erc20_",
            },
            providers: {
              mockProvider1: [
                {
                  methods: ["float", "fixed"],
                  pairs: {
                    8: [143, 7],
                    143: [7, 8],
                    7: [8],
                  },
                },
              ],
              mockProvider2: [
                {
                  methods: ["float"],
                  pairs: {
                    8: [143, 7],
                    143: [7, 8],
                    7: [8],
                  },
                },
              ],
            },
          },
        },
      },
    ],
  },
];
