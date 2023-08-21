import { getCryptoCurrencyById } from "./currencies";
import {
  addTokens,
  convertERC20,
  listTokens,
  __clearAllLists,
  findTokenById,
  listTokensForCryptoCurrency,
  createTokenHash,
} from "./tokens";
import { ERC20Token } from "./types";

const initMainToken: ERC20Token[] = [
  [
    "ethereum",
    "ki",
    "XKI",
    6,
    "Ki",
    "304402201fe22e202db62b632e0647a12070c24f34de2006e667abedaed5ca6ea2986b18022054dd4eda5bf5e444601a48e5370cfcf0b51cc5fe1237259f6066311286dbfd55",
    "0x4f6103BAd230295baCF30f914FDa7D4273B7F585",
    true,
    false,
  ],
  [
    "ethereum",
    "kiba_inu",
    "KIBA",
    18,
    "Kiba Inu",
    "3045022100baa979e8461d439b324416dff31f277663b51fa36e5e60005933292d5151f32502200528872863ce6b55009387bd2c5b6556b907193e27f506236149634a97518822",
    "0x005D1123878Fc55fbd56b54C73963b234a64af3c",
    false,
    false,
  ],
  [
    "ethereum",
    "kick",
    "KICK",
    8,
    "KICK",
    "3044022000b06bf563f55da06b142b6816e824492a4862673f29842aa8b46f23a7dcbe57022049309464e7123f79df5bcead066a2b0af929965d3d9dc683a324eda32f970b07",
    "0x27695E09149AdC738A978e9A678F99E4c39e9eb9",
    true,
    true,
  ],
  [
    "ethereum",
    "0xmonero",
    "0XMR",
    18,
    "0xMonero",
    "30440220544ecf38d2906770446f52557f2dd42b6aa274bc960c808c4dcee42c44e8412202206fab6769ebe15fbfb7245b0156d17e432a1acd9920f1ecbf25729f8d8594af6c",
    "0x035dF12E0F3ac6671126525f1015E47D79dFEDDF",
    false,
    true,
  ],
];

const ethereumCurrency = getCryptoCurrencyById("ethereum");

describe("tokens", () => {
  beforeEach(() => {
    __clearAllLists();
  });
  describe("addTokens", () => {
    it("Should list token to be empty", () => {
      expect(listTokens().length).toBe(0);
    });

    it("Add tokens normally and check if delisted work correclty", () => {
      addTokens(initMainToken.map(convertERC20));
      expect(listTokens().length).toBe(2);
      expect(listTokens({ withDelisted: true }).length).toBe(4);
      expect(listTokensForCryptoCurrency(ethereumCurrency).length).toBe(2);
      expect(listTokensForCryptoCurrency(ethereumCurrency, { withDelisted: true }).length).toBe(4);
    });

    it("Add token and readd the same token shouldn't delete anything", () => {
      addTokens(initMainToken.map(convertERC20));
      const changeToken: ERC20Token[] = [
        [
          "ethereum",
          "kiba_inu",
          "KIBA",
          18,
          "Kiba Inu",
          "3045022100baa979e8461d439b324416dff31f277663b51fa36e5e60005933292d5151f32502200528872863ce6b55009387bd2c5b6556b907193e27f506236149634a97518822",
          "0x005D1123878Fc55fbd56b54C73963b234a64af3c",
          false,
          false,
        ],
      ];
      const tokenHash = createTokenHash(convertERC20(changeToken[0]));
      const existingToken = listTokens().find(t => t.ticker === "KIBA");
      if (!existingToken) throw new Error("Should not be empty");
      expect(tokenHash).toBe(createTokenHash(existingToken));

      addTokens(changeToken.map(convertERC20));
      const tokenAfterChange = listTokens().find(t => t.ticker === "KIBA");
      if (!tokenAfterChange) throw new Error("Should not be empty");
      expect(tokenHash).toBe(createTokenHash(tokenAfterChange));
    });

    it("Add tokens normally and then delist one token", () => {
      addTokens(initMainToken.map(convertERC20));
      const changeToken: ERC20Token[] = [
        [
          "ethereum",
          "kiba_inu",
          "KIBA",
          18,
          "Kiba Inu",
          "3045022100baa979e8461d439b324416dff31f277663b51fa36e5e60005933292d5151f32502200528872863ce6b55009387bd2c5b6556b907193e27f506236149634a97518822",
          "0x005D1123878Fc55fbd56b54C73963b234a64af3c",
          false,
          true,
        ],
      ];
      addTokens(changeToken.map(convertERC20));
      expect(listTokens().length).toBe(1);
      findTokenById("kiba_inu");
      expect(listTokens({ withDelisted: true }).length).toBe(4);

      expect(listTokensForCryptoCurrency(ethereumCurrency).length).toBe(1);
      expect(listTokensForCryptoCurrency(ethereumCurrency, { withDelisted: true }).length).toBe(4);
    });
  });
});
