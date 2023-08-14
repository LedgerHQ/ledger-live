export const providersRoutes = (): object => [
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
              changelly: [
                {
                  methods: ["float", "fixed"],
                  pairs: {
                    8: [143, 7],
                    143: [7, 8],
                    7: [8],
                  },
                },
              ],
              cic: [
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
      {
        id: "no-providers", // variant id
        type: "json", // variant handler id
        options: {
          status: 200, // status to send
          body: {
            currencies: {},
            providers: {},
          },
        },
      },
    ],
  },
];
