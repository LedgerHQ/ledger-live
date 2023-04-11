// providers getting called twice - why?

export const getProvidersMock = () => {
  return JSON.stringify({
    currencies: {
      7: "ethereum/erc20/usd_tether__erc20_",
      8: "bitcoin",
      149: "ethereum",
      195: "dogecoin",
    },
    providers: {
      changelly: [
        {
          methods: ["fixed", "float"],
          pairs: {
            7: [8, 149, 195],
            8: [7, 149, 195],
            149: [7, 8, 195],
            195: [7, 8, 149],
          },
        },
      ],
      cic: [
        {
          methods: ["fixed", "float"],
          pairs: {
            7: [8, 149],
            8: [7, 149],
            149: [7, 8],
          },
        },
      ],
      oneinch: [
        {
          methods: ["float"],
          pairs: {
            7: [149],
            149: [7],
          },
        },
      ],
      paraswap: [
        {
          methods: ["float"],
          pairs: {
            7: [149],
            149: [7],
          },
        },
      ],
    },
  });
};
