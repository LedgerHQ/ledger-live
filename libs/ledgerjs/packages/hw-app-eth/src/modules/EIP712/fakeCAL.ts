export default {
  "1:0x7f268357a8c2552623316e2562d90e642bb538e5": {
    d8e4f2bd77f7562e99ea5df4adb127291a2bfbc225ae55450038f27f: {
      contractName: {
        label: "OpenSea Listing",
        signature:
          "3046022100f9bcacc1a12b3131edbd9686c761b2a2baf6051383c4eb29ed5e321c613446cc022100f60e711f90c74d48d2311d2ff73a6cd35001c591350b4e4703ddb12ca6ab95d0",
      },
      fields: [
        {
          label: "Exchange",
          path: "exchange",
          signature:
            "3046022100896c72b74be2f474650d6b40c2520cdeadfb8e5e89896cdda1fa06bcf802205b02210090df0a1d70ea2214bdf79a0279935ecef8222154834325eb924c8798e9869a7c",
        },
        {
          label: "Price",
          path: "basePrice",
          signature:
            "3045022003da26792c9544ace20a45de834c4a67f37e9dbd561f2752725327fcc832940d022100d25266668989aece7fb40bda6f808347ba50d42830ca23906fe2f5502e32798e",
        },
        {
          label: "Offer expiration",
          path: "expirationTime",
          signature:
            "3045022100f15673a16f5f91db11ba303a741716e69cc5546e5960155f31f8fa11e6bc838202204638d5002963893b73283b6b8fc4b090b363007a78dbf30b039402b98044b35a",
        },
      ],
    },
  },
  "1:0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC": {
    "1fd77fb96a82b9c1de173fa836e20da791158ea832a3d07c6725f47c": {
      contractName: {
        label: "Sending a message",
        signature:
          "3045022100ae447aa4582f2000a8f270143a547c0b4fa5dae6012cac87985d439ec59d6c9a0220442567ca10da85648ebd8c3ea4720dfb7ab681258bb4429f19f44dee63491d9c",
      },
      fields: [
        {
          label: "From",
          path: "from.name",
          signature:
            "3044022025589543a1c7bf52d9e1dda835ed030130bb8dad1ed406dc11f68167e4dfcfe30220205b7f4ff96ca76b2ef935e71b16bbd8de0e2b35d43b8ea6842b5d640376bda8",
        },
        {
          label: "Sender Address",
          path: "from.wallets.[]",
          signature:
            "304502206e269e40271f676092db738951bbbb497c55176de4c85f55b69b4705a63a23620221009990d70e70cb8d0b178df5ec6dbc2efa4afe90515b9e694a300d093e8e9afb3a",
        },
        {
          label: "To",
          path: "to.name",
          signature:
            "30440220041248c4822710f9ec3266a7ba559151112713c102b3ea7bb93317a32734484302203d30f3c2b6546133af74f3091ac47b1c5449eb08bf1d03c806b517665f5b4ffd",
        },
        {
          label: "Recipient Address",
          path: "to.wallets.[]",
          signature:
            "30440220759428b499a667244baf93d2d366d524a384e721b9cab097c0de3b77e5174eae022059844e46a088d0e7aff2e43b97a646ceeb160431f343ab44acf0f26828d00cb1",
        },
        {
          label: "Message",
          path: "contents",
          signature:
            "3045022100cfaa87ee732a9e83c47e67809828a5af239b6c94a2a81d4c2a08878c16ceb7b102205d40c17a80e98a95168de22cc3ed40a2f2fbf2c3ad917aa45705e0c8b4894924",
        },
      ],
    },
  },
};
