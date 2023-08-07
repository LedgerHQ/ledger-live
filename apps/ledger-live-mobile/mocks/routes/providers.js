module.exports = [
  {
    id: "provider", // route id
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
              currencies: {
                98: "ethereum/erc20/frax_share",
              },
              providers: {
                changelly: [
                  {
                    methods: ["float"],
                    pairs: {
                      131: [
                        107, 4, 79, 94, 126, 136, 47, 15, 163, 68, 62, 178, 122, 83, 100, 90, 111,
                      ],
                      45: [69, 138, 101, 0, 88, 170, 115, 5, 120, 10, 56, 142, 111],
                    },
                  },
                ],
              },
            },

            // {
            //   provider: "provider 1",
            //   pairs: [
            //     { from: "bitcoin", to: "ethereum", tradeMethod: "float" },
            //     { from: "bitcoin", to: "ethereum", tradeMethod: "fixed" },
            //     { from: "bitcoin", to: "dogecoin", tradeMethod: "float" },
            //     { from: "bitcoin", to: "dogecoin", tradeMethod: "fixed" },
            //     { from: "ethereum", to: "bitcoin", tradeMethod: "float" },
            //     { from: "ethereum", to: "bitcoin", tradeMethod: "fixed" },
            //   ],
            // },
            // {
            //   provider: "provider 2",
            //   pairs: [
            //     { from: "bitcoin", to: "ethereum", tradeMethod: "float" },
            //     { from: "bitcoin", to: "ethereum", tradeMethod: "fixed" },
            //     { from: "ethereum", to: "bitcoin", tradeMethod: "float" },
            //     { from: "ethereum", to: "bitcoin", tradeMethod: "fixed" },
            //   ],
            // },
          ], // body to send
        },
      },
    ],
  },
];
