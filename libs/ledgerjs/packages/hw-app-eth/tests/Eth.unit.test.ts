import axios from "axios";
import { ethers } from "ethers";
import {
  openTransportReplayer,
  RecordStore,
} from "@ledgerhq/hw-transport-mocker";
import {
  ERC1155_CLEAR_SIGNED_SELECTORS,
  ERC721_CLEAR_SIGNED_SELECTORS,
} from "../src/utils";
import Eth, { ledgerService } from "../src/Eth";
import CAL_ETH from "./fixtures/SignatureCALEth";
import ERC20_ABI from "./fixtures/ABI/ERC20.json";
import ERC721_ABI from "./fixtures/ABI/ERC721.json";
import ERC1155_ABI from "./fixtures/ABI/ERC1155.json";
import PARASWAP_ABI from "./fixtures/ABI/PARASWAP.json";
import ParaswapJSON from "./fixtures/REST/Paraswap-Plugin.json";

jest.mock("axios");

describe("Eth app biding", () => {
  describe("clearSignTransaction", () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    it("should clear sign the coin transaction", async () => {
      const spy = jest.spyOn(axios, "request");
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
        => e00400003f058000002c8000003c80000000000000000000000002e801808417d78400850c529dc58c82520894b0b5b0106d69fe64545a60a68c014f7570d3f8610180c0
        <= 00339a8118c0329e403415129205d1d019e5fc5c95bc746b7e9e6efde3ddebfc1107c0393a6bba61a6f3eabc9a1d8298820fd0316436b49b0bc4082bfab81531e39000
        `)
      );

      const eth = new Eth(transport);
      const result = await eth.clearSignTransaction(
        "44'/60'/0'/0/0",
        ethers.utils
          .serializeTransaction({
            to: "0xB0b5B0106D69fE64545A60A68C014f7570D3F861",
            value: ethers.BigNumber.from("1"),
            gasLimit: ethers.BigNumber.from("21000"),
            maxPriorityFeePerGas: ethers.BigNumber.from("400000000"),
            maxFeePerGas: ethers.BigNumber.from("52925678988"),
            chainId: 1,
            nonce: 0,
            type: 2,
          })
          .substring(2),
        { erc20: true, externalPlugins: true, nft: true },
        true
      );
      expect(result).toEqual({
        r: "339a8118c0329e403415129205d1d019e5fc5c95bc746b7e9e6efde3ddebfc11",
        s: "07c0393a6bba61a6f3eabc9a1d8298820fd0316436b49b0bc4082bfab81531e3",
        v: "00",
      });
      expect(spy).not.toHaveBeenCalled();
    });

    it("should clear sign the ERC20 transaction", async () => {
      const spy = jest.spyOn(axios, "get");
      spy.mockImplementation(async (url) => {
        if (url?.includes("erc20-signatures")) {
          return { data: CAL_ETH } as any;
        }
        return Promise.reject({ response: { status: 404 } }) as any;
      });
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
        => e00a000068054d415449437d1afa7b718fb893db30a3abc0cfc608aacfebb000000012000000013044022000d8fa7b6e409a0dc55723ba975179e7d1181d1fc78fccbece4e5a264814366a02203927d84a710c8892d02f7386ad20147c75fba4bdd486b0256ecd005770a7ca5b
        <= 9000
        => e004000085058000002c8000003c80000000000000000000000002f86d01808420c85580850dfe94e19e82fd25947d1afa7b718fb893db30a3abc0cfc608aacfebb080b844a9059cbb000000000000000000000000b0b5b0106d69fe64545a60a68c014f7570d3f8610000000000000000000000000000000000000000000000000de0b6b3a7640000c0
        <= 00089a7656b73c72721952d9102dcb608b5f8e9e12e8dfa5d546743e3aa5ff99e24adc7e77795383bb1df13c572db4abfbce86ee4bbe3eaf9b3b50e5b5524793829000
        `)
      );

      const eth = new Eth(transport);
      const contract = new ethers.utils.Interface(ERC20_ABI);
      const result = await eth.clearSignTransaction(
        "44'/60'/0'/0/0",
        ethers.utils
          .serializeTransaction({
            to: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
            value: ethers.BigNumber.from("0"),
            gasLimit: ethers.BigNumber.from("64805"),
            maxPriorityFeePerGas: ethers.BigNumber.from("550000000"),
            maxFeePerGas: ethers.BigNumber.from("60105744798"),
            data: contract.encodeFunctionData("transfer", [
              "0xb0b5b0106d69fe64545a60a68c014f7570d3f861",
              ethers.utils.parseUnits("1", 18),
            ]),
            chainId: 1,
            nonce: 0,
            type: 2,
          })
          .substring(2),
        { erc20: true, externalPlugins: true, nft: true },
        true
      );
      expect(result).toEqual({
        r: "089a7656b73c72721952d9102dcb608b5f8e9e12e8dfa5d546743e3aa5ff99e2",
        s: "4adc7e77795383bb1df13c572db4abfbce86ee4bbe3eaf9b3b50e5b552479382",
        v: "00",
      });
      expect(spy).toHaveBeenCalledTimes(2); // 1 time for ERC20 dynamic CAL + 1 time for Ethereum plugins
    });

    it("should clear sign the ERC721 transaction with plugin load", async () => {
      const contractAddr = "0x60f80121c31a0d46b5279700f9df786054aa5ee5";
      const spy = jest.spyOn(axios, "get");
      spy.mockImplementation(async (url) => {
        if (
          url.includes(
            `${contractAddr}/plugin-selector/${ERC721_CLEAR_SIGNED_SELECTORS.SAFE_TRANSFER_FROM}`
          )
        ) {
          return {
            data: {
              payload:
                "01010645524337323160f80121c31a0d46b5279700f9df786054aa5ee542842e0e0000000000000001020147304502203fa78c4aaca8c8e7e69c4a5a360d91f35d577827b0da2f3fb4adf16a0f94601802210089031d0b8ac2e66a66fc9062b65a233772df46de01f5f28b0c631a4700c1562f",
            },
          };
        } else if (url.includes(`contracts/${contractAddr}`)) {
          return {
            data: {
              payload:
                "01010752617269626c6560f80121c31a0d46b5279700f9df786054aa5ee500000000000000010101473045022067d4254b89367a7e35fe7507001d6c8a0844a35aa4839c94a4724de1f332382d022100b9353df1f6f69feb9970946603723657f5682e0cac1b480a2beb2ecba10c872f",
            },
          } as any;
        }
        return Promise.reject({ response: { status: 404 } }) as any;
      });
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
        => e01600007301010645524337323160f80121c31a0d46b5279700f9df786054aa5ee542842e0e0000000000000001020147304502203fa78c4aaca8c8e7e69c4a5a360d91f35d577827b0da2f3fb4adf16a0f94601802210089031d0b8ac2e66a66fc9062b65a233772df46de01f5f28b0c631a4700c1562f
        <= 9000
        => e01400007001010752617269626c6560f80121c31a0d46b5279700f9df786054aa5ee500000000000000010101473045022067d4254b89367a7e35fe7507001d6c8a0844a35aa4839c94a4724de1f332382d022100b9353df1f6f69feb9970946603723657f5682e0cac1b480a2beb2ecba10c872f
        <= 9000
        => e004000096058000002c8000003c80000000000000000000000002f88e018084448b9b80851278cdd392830238699460f80121c31a0d46b5279700f9df786054aa5ee580b86442842e0e0000000000000000000000006cbcd73cd8e8a42844662f0a0e76d7f79afd933d000000000000000000000000b0b5b0106d69fe64545a60a68c014f7570d3f8610000000000000000000000000000000000
        <= 9000
        => e004800010000000000000000000000000112999c0
        <= 0187ce0994bbdfdfd93990a5afc03d7cf70a14c9efaabac810724a41f6375f54236c0056a02dc07650b1e68f86b9f18a92ff689a9eddf710bd9f76739260fff1939000
        `)
      );

      const eth = new Eth(transport);
      const contract = new ethers.utils.Interface(ERC721_ABI);
      const result = await eth.clearSignTransaction(
        "44'/60'/0'/0/0",
        ethers.utils
          .serializeTransaction({
            to: contractAddr,
            value: ethers.BigNumber.from("0"),
            gasLimit: ethers.BigNumber.from("145513"),
            maxPriorityFeePerGas: ethers.BigNumber.from("1150000000"),
            maxFeePerGas: ethers.BigNumber.from("79336166290"),
            data: contract.encodeFunctionData(
              contract.getFunction("safeTransferFrom(address,address,uint256)"),
              [
                "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
                "0xb0b5b0106d69fe64545a60a68c014f7570d3f861",
                "1124761",
              ]
            ),
            chainId: 1,
            nonce: 0,
            type: 2,
          })
          .substring(2),
        { erc20: true, externalPlugins: true, nft: true },
        true
      );
      expect(result).toEqual({
        r: "87ce0994bbdfdfd93990a5afc03d7cf70a14c9efaabac810724a41f6375f5423",
        s: "6c0056a02dc07650b1e68f86b9f18a92ff689a9eddf710bd9f76739260fff193",
        v: "01",
      });
      expect(spy).toHaveBeenCalledTimes(3); // 1 time backend nft selector + 1 time backend nft information + plugin json file
    });

    it("should clear sign the ERC1155 transaction with plugin load", async () => {
      const contractAddr = "0xd07dc4262bcdbf85190c01c996b4c06a461d2430";
      const spy = jest.spyOn(axios, "get");
      spy.mockImplementation(async (url) => {
        if (
          url.includes(
            `${contractAddr}/plugin-selector/${ERC1155_CLEAR_SIGNED_SELECTORS.SAFE_TRANSFER_FROM}`
          )
        ) {
          return {
            data: {
              payload:
                "01010745524331313535d07dc4262bcdbf85190c01c996b4c06a461d2430f242432a0000000000000001020146304402201b82317133172618ff680589dc38ea3647d59c49a3ee299c09180e865f6786890220027a7ad14fc8beaa14b7e7c907e26abb2f0aad6ccd93b245acee7d70517ea062",
            },
          };
        } else if (url.includes(`contracts/${contractAddr}`)) {
          return {
            data: {
              payload:
                "01010752617269626c65d07dc4262bcdbf85190c01c996b4c06a461d243000000000000000010101473045022100fddd2264ca0eb3cc8a588d82b41edf9d262145a0ca1f08caab5bb6a4eac34a9e0220602b57cabdc40bbeb3a46a5d362ac2544124c9806aee196a87a51f61bb7e9230",
            },
          } as any;
        }
        return Promise.reject({ response: { status: 404 } }) as any;
      });
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
        => e01600007301010745524331313535d07dc4262bcdbf85190c01c996b4c06a461d2430f242432a0000000000000001020146304402201b82317133172618ff680589dc38ea3647d59c49a3ee299c09180e865f6786890220027a7ad14fc8beaa14b7e7c907e26abb2f0aad6ccd93b245acee7d70517ea062
        <= 9000
        => e01400007001010752617269626c65d07dc4262bcdbf85190c01c996b4c06a461d243000000000000000010101473045022100fddd2264ca0eb3cc8a588d82b41edf9d262145a0ca1f08caab5bb6a4eac34a9e0220602b57cabdc40bbeb3a46a5d362ac2544124c9806aee196a87a51f61bb7e9230
        <= 9000
        => e004000096058000002c8000003c80000000000000000000000002f8ee01808414dc9380850d54eb0ea883010ab494d07dc4262bcdbf85190c01c996b4c06a461d243080b8c4f242432a0000000000000000000000006cbcd73cd8e8a42844662f0a0e76d7f79afd933d000000000000000000000000b0b5b0106d69fe64545a60a68c014f7570d3f8610000000000000000000000000000000000
        <= 9000
        => e00480007000000000000000000000000004041c000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000000c0
        <= 016467047c39c2c3db9dbe8aa03802c80830beb659f0eed7470735098f2c44cfae7b2aa36e2f31c6e0d37a00b93789ef4eef4fd016dd3b92fa893e7e741a152be99000
        `)
      );

      const eth = new Eth(transport);
      const contract = new ethers.utils.Interface(ERC1155_ABI);
      const result = await eth.clearSignTransaction(
        "44'/60'/0'/0/0",
        ethers.utils
          .serializeTransaction({
            to: contractAddr,
            value: ethers.BigNumber.from("0"),
            gasLimit: ethers.BigNumber.from("68276"),
            maxPriorityFeePerGas: ethers.BigNumber.from("350000000"),
            maxFeePerGas: ethers.BigNumber.from("57259265704"),
            data: contract.encodeFunctionData("safeTransferFrom", [
              "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
              "0xb0b5b0106d69fe64545a60a68c014f7570d3f861",
              "263196",
              "1",
              "0x",
            ]),
            chainId: 1,
            nonce: 0,
            type: 2,
          })
          .substring(2),
        { erc20: true, externalPlugins: true, nft: true },
        true
      );
      expect(result).toEqual({
        r: "6467047c39c2c3db9dbe8aa03802c80830beb659f0eed7470735098f2c44cfae",
        s: "7b2aa36e2f31c6e0d37a00b93789ef4eef4fd016dd3b92fa893e7e741a152be9",
        v: "01",
      });
      expect(spy).toHaveBeenCalledTimes(3); // 1 time backend nft selector + 1 time backend nft information + plugin json file
    });

    it("should clear sign the external plugin transaction", async () => {
      const spy = jest.spyOn(axios, "get");
      spy.mockImplementation(async (url) => {
        if (url?.includes("erc20-signatures")) {
          return { data: CAL_ETH } as any;
        } else if (url?.includes("ethereum.json")) {
          return { data: ParaswapJSON } as any;
        }
        return Promise.reject({ response: { status: 404 } }) as any;
      });
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
        => e012000068085061726173776170def171fe48cf0115b1d80b88dc8eab59176fee5754e3f31b3045022100ec8e69d23371437ce5b5f1d894b836c036748e2fabf52fb069c34a9d0ba8704a022013e761d81c26ece4cb0ea385813699b7e646354d3404ed55f4bf068db02dda9a
        <= 9000
        => e00a000068054d415449437d1afa7b718fb893db30a3abc0cfc608aacfebb000000012000000013044022000d8fa7b6e409a0dc55723ba975179e7d1181d1fc78fccbece4e5a264814366a02203927d84a710c8892d02f7386ad20147c75fba4bdd486b0256ecd005770a7ca5b
        <= 9000
        => e00a000067034441496b175474e89094c44da98b954eedeac495271d0f00000012000000013045022100b3aa979633284eb0f55459099333ab92cf06fdd58dc90e9c070000c8e968864c02207b10ec7d6609f51dda53d083a6e165a0abf3a77e13250e6f260772809b49aff5
        <= 9000
        => e004000096058000002c8000003c80000000000000000000000002f9048f018084448b9b8085143fc44a5883048f8b94def171fe48cf0115b1d80b88dc8eab59176fee5780b9046454e3f31b00000000000000000000000000000000000000000000000000000000000000200000000000000000000000007d1afa7b718fb893db30a3abc0cfc608aacfebb00000000000000000000000006b1754
        <= 9000
        => e00480009674e89094c44da98b954eedeac495271d0f0000000000000000000000000000000000000000000000000de0b6b3a764000000000000000000000000000000000000000000000000000014655db2d8c71619000000000000000000000000000000000000000000000000147f9aa1bc47718c00000000000000000000000000000000000000000000000000000000000001e00000000000
        <= 9000
        => e004800096000000000000000000000000000000000000000000000000000220000000000000000000000000000000000000000000000000000000000000038000000000000000000000000000000000000000000000000000000000000003e00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000558247e365be655f9144e1a0140d79
        <= 9000
        => e0048000963984372ef3010000000000000000000000000000000000000000000000000000000000405f000000000000000000000000000000000000000000000000000000000000042000000000000000000000000000000000000000000000000000000000640be3823d2fae4b5ec240cd871aa6b675e99899000000000000000000000000000000000000000000000000000000000000000000
        <= 9000
        => e004800096000000000000000000000000000001000000000000000000000000e592427a0aece92de3edee1f18e0157c058615640000000000000000000000000000000000000000000000000000000000000124c04b8d59000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000a0000000
        <= 9000
        => e004800096000000000000000000def171fe48cf0115b1d80b88dc8eab59176fee5700000000000000000000000000000000000000000000000000000000640b9d320000000000000000000000000000000000000000000000000de0b6b3a7640000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000
        <= 9000
        => e0048000960000000000002b7d1afa7b718fb893db30a3abc0cfc608aacfebb00027106b175474e89094c44da98b954eedeac495271d0f00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000
        <= 9000
        => e00480008e000000000000000000000000000000000000000000000000000000000000000000000000000000000000000124000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c0
        <= 00775aed341ee9f0a0d0c0d724e242f9def19c09df02d1c474bc5750c86b952f5535bd98bc4a6482a895e94cd5ca9351ec1daeb955251a35dc8c2fb86851bf49189000        
        `)
      );

      const eth = new Eth(transport);
      const contract = new ethers.utils.Interface(PARASWAP_ABI);
      const result = await eth.clearSignTransaction(
        "44'/60'/0'/0/0",
        ethers.utils
          .serializeTransaction({
            to: "0xdef171fe48cf0115b1d80b88dc8eab59176fee57",
            value: ethers.BigNumber.from("0"),
            gasLimit: ethers.BigNumber.from("298891"),
            maxPriorityFeePerGas: ethers.BigNumber.from("1150000000"),
            maxFeePerGas: ethers.BigNumber.from("86969174616"),
            data: contract.encodeFunctionData("simpleSwap", [
              [
                "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0", // MATIC
                "0x6B175474E89094C44Da98b954EedeAC495271d0F", // DAI
                "0x0de0b6b3a7640000", // 1 MATIC
                "0x14655db2d8c71619", // ~1.469 DAI
                "0x147f9aa1bc47718c", // EXPECT 1.477 DAI
                ["0xE592427A0AEce92De3Edee1F18E0157C05861564"],
                "0xc04b8d59000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000def171fe48cf0115b1d80b88dc8eab59176fee5700000000000000000000000000000000000000000000000000000000640b9d320000000000000000000000000000000000000000000000000de0b6b3a76400000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002b7d1afa7b718fb893db30a3abc0cfc608aacfebb00027106b175474e89094c44da98b954eedeac495271d0f000000000000000000000000000000000000000000",
                ["0x00", "0x0124"],
                ["0x00"],
                "0x0000000000000000000000000000000000000000",
                "0x558247e365be655f9144e1a0140D793984372Ef3",
                "0x010000000000000000000000000000000000000000000000000000000000405f",
                "0x",
                "0x640be382",
                "0x3d2fae4b5ec240cd871aa6b675e99899",
              ],
            ]),
            chainId: 1,
            nonce: 0,
            type: 2,
          })
          .substring(2),
        { erc20: true, externalPlugins: true, nft: true },
        true
      );
      expect(result).toEqual({
        r: "775aed341ee9f0a0d0c0d724e242f9def19c09df02d1c474bc5750c86b952f55",
        s: "35bd98bc4a6482a895e94cd5ca9351ec1daeb955251a35dc8c2fb86851bf4918",
        v: "00",
      });
      expect(spy).toHaveBeenCalledTimes(3); // 1 time plugin json file + 2 times CAL signatures <-- FIXME 1 time should be enough
    });

    it("should throw in case of error with strict mode", async () => {
      const err = new Error("strictModeCatchThis");
      jest.spyOn(ledgerService, "resolveTransaction").mockRejectedValue(err);
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      const eth = new Eth(transport);
      try {
        await eth.clearSignTransaction(
          "44'/60'/0'/0/0",
          ethers.utils
            .serializeTransaction({
              to: "0xB0b5B0106D69fE64545A60A68C014f7570D3F861",
              value: ethers.BigNumber.from("1"),
              gasLimit: ethers.BigNumber.from("21000"),
              maxPriorityFeePerGas: ethers.BigNumber.from("400000000"),
              maxFeePerGas: ethers.BigNumber.from("52925678988"),
              chainId: 1,
              nonce: 0,
              type: 2,
            })
            .substring(2),
          { erc20: true, externalPlugins: true, nft: true },
          true
        );
        fail("Promise should have been rejected");
      } catch (e) {
        expect(e).toBe(err);
      }
    });

    it("should not throw in case of error without strict mode", async () => {
      const err = new Error("strictModeCatchThis");
      jest.spyOn(ledgerService, "resolveTransaction").mockRejectedValue(err);
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
        => e00400003f058000002c8000003c80000000000000000000000002e801808417d78400850c529dc58c82520894b0b5b0106d69fe64545a60a68c014f7570d3f8610180c0
        <= 00339a8118c0329e403415129205d1d019e5fc5c95bc746b7e9e6efde3ddebfc1107c0393a6bba61a6f3eabc9a1d8298820fd0316436b49b0bc4082bfab81531e39000
        `)
      );

      const eth = new Eth(transport);
      try {
        await eth.clearSignTransaction(
          "44'/60'/0'/0/0",
          ethers.utils
            .serializeTransaction({
              to: "0xB0b5B0106D69fE64545A60A68C014f7570D3F861",
              value: ethers.BigNumber.from("1"),
              gasLimit: ethers.BigNumber.from("21000"),
              maxPriorityFeePerGas: ethers.BigNumber.from("400000000"),
              maxFeePerGas: ethers.BigNumber.from("52925678988"),
              chainId: 1,
              nonce: 0,
              type: 2,
            })
            .substring(2),
          { erc20: true, externalPlugins: true, nft: true },
          false
        );
      } catch (e) {
        fail("Should not throw");
      }
    });
  });
});
