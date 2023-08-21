import axios from "axios";
import { fail } from "assert";
import { ethers } from "ethers";
import BigNumber from "bignumber.js";
import { openTransportReplayer, RecordStore } from "@ledgerhq/hw-transport-mocker";
import Eth, { ledgerService } from "../src/Eth";
import CAL_ETH from "./fixtures/SignatureCALEth";
import ERC20_ABI from "./fixtures/ABI/ERC20.json";
import ERC721_ABI from "./fixtures/ABI/ERC721.json";
import ERC1155_ABI from "./fixtures/ABI/ERC1155.json";
import PARASWAP_ABI from "./fixtures/ABI/PARASWAP.json";
import { ResolutionConfig } from "../src/services/types";
import ParaswapJSON from "./fixtures/REST/Paraswap-Plugin.json";
import { byContractAddressAndChainId } from "../src/services/ledger/erc20";
import { ERC1155_CLEAR_SIGNED_SELECTORS, ERC721_CLEAR_SIGNED_SELECTORS } from "../src/utils";

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
        `),
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
        true,
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
      spy.mockImplementation(async url => {
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
        `),
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
        true,
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
      spy.mockImplementation(async url => {
        if (
          url.includes(
            `${contractAddr}/plugin-selector/${ERC721_CLEAR_SIGNED_SELECTORS.SAFE_TRANSFER_FROM}`,
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
        `),
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
              ],
            ),
            chainId: 1,
            nonce: 0,
            type: 2,
          })
          .substring(2),
        { erc20: true, externalPlugins: true, nft: true },
        true,
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
      spy.mockImplementation(async url => {
        if (
          url.includes(
            `${contractAddr}/plugin-selector/${ERC1155_CLEAR_SIGNED_SELECTORS.SAFE_TRANSFER_FROM}`,
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
        `),
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
        true,
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
      spy.mockImplementation(async url => {
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
        `),
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
        true,
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
          true,
        );
        fail("Promise should have been rejected");
      } catch (e) {
        expect(e).toBe(err);
      } finally {
        // @ts-expect-error jest mock
        ledgerService.resolveTransaction.mockRestore();
      }
    });

    it("should not throw in case of error without strict mode", async () => {
      const err = new Error("strictModeCatchThis");
      jest.spyOn(ledgerService, "resolveTransaction").mockRejectedValue(err);
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
        => e00400003f058000002c8000003c80000000000000000000000002e801808417d78400850c529dc58c82520894b0b5b0106d69fe64545a60a68c014f7570d3f8610180c0
        <= 00339a8118c0329e403415129205d1d019e5fc5c95bc746b7e9e6efde3ddebfc1107c0393a6bba61a6f3eabc9a1d8298820fd0316436b49b0bc4082bfab81531e39000
        `),
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
          false,
        );
      } catch (e) {
        fail("Should not throw");
      } finally {
        // @ts-expect-error jest mock
        ledgerService.resolveTransaction.mockRestore();
      }
    });
  });

  describe("hw-app-eth older Integration Tests", () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    async function signTxWithResolution(
      eth: Eth,
      path: string,
      tx: string,
      resolutionConfig?: ResolutionConfig,
    ) {
      const resolution = await ledgerService
        .resolveTransaction(
          tx,
          {},
          resolutionConfig || { externalPlugins: true, erc20: true, nft: true },
        )
        .catch(e => {
          console.warn(
            "an error occurred in resolveTransaction => fallback to blind signing: " + String(e),
          );
          return null;
        });
      return eth.signTransaction(path, tx, resolution);
    }

    test("getAppConfiguration", async () => {
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
      => e006000000
      <= 010101069000
      `),
      );

      const eth = new Eth(transport);
      const result = await eth.getAppConfiguration();

      expect(result).toEqual({
        arbitraryDataEnabled: 1,
        erc20ProvisioningNecessary: 0,
        starkEnabled: 0,
        starkv2Supported: 0,
        version: "1.1.6",
      });
    });

    test("getAddress", async () => {
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
      => e002000015058000002c8000003c800000008000000000000000
      <= 4104df00ad3869baad7ce54f4d560ba7f268d542df8f2679a5898d78a690c3db8f9833d2973671cb14b088e91bdf7c0ab00029a576473c0e12f84d252e630bb3809b28436241393833363265313939633431453138363444303932334146393634366433413634383435319000
      `),
      );
      const eth = new Eth(transport);
      const result = await eth.getAddress("44'/60'/0'/0'/0");

      expect(result).toEqual({
        address: "0xCbA98362e199c41E1864D0923AF9646d3A648451",
        publicKey:
          "04df00ad3869baad7ce54f4d560ba7f268d542df8f2679a5898d78a690c3db8f9833d2973671cb14b088e91bdf7c0ab00029a576473c0e12f84d252e630bb3809b",
      });
    });

    test("signTransaction", async () => {
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
      => e00400003e058000002c8000003c800000008000000000000000e8018504e3b292008252089428ee52a8f3d6e5d15f8b131996950d7f296c7952872bd72a2487400080
      <= 1b3694583045a85ada8d15d5e01b373b00e86a405c9c52f7835691dcc522b7353b30392e638a591c65ed307809825ca48346980f52d004ab7a5f93657f7e62a4009000
      `),
      );
      const eth = new Eth(transport);
      const result = await signTxWithResolution(
        eth,
        "44'/60'/0'/0'/0",
        "e8018504e3b292008252089428ee52a8f3d6e5d15f8b131996950d7f296c7952872bd72a2487400080",
      );
      expect(result).toEqual({
        r: "3694583045a85ada8d15d5e01b373b00e86a405c9c52f7835691dcc522b7353b",
        s: "30392e638a591c65ed307809825ca48346980f52d004ab7a5f93657f7e62a400",
        v: "1b",
      });
    });

    test("signTransaction supports EIP1559", async () => {
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
      => e004000046058000002c8000003c80000000000000000000000002ef0306843b9aca008504a817c80082520894b2bb2b958afa2e96dab3f3ce7162b87daea39017872386f26fc1000080c0
      <= 003ccff815955e82c416dcf2ace0bf0aa5f479acd47f5152f0c1753cf68fb723746774b8bff4f776f2788bb19c87c22ca8a2933ea4415eed8d25a9ea0500c81ce19000
      `),
      );
      const eth = new Eth(transport);
      const result = await signTxWithResolution(
        eth,
        "44'/60'/0'/0/0",
        "02ef0306843b9aca008504a817c80082520894b2bb2b958afa2e96dab3f3ce7162b87daea39017872386f26fc1000080c0",
      );
      expect(result).toEqual({
        r: "3ccff815955e82c416dcf2ace0bf0aa5f479acd47f5152f0c1753cf68fb72374",
        s: "6774b8bff4f776f2788bb19c87c22ca8a2933ea4415eed8d25a9ea0500c81ce1",
        v: "00",
      });
    });

    test("signTransaction supports EIP1559 with tokens", async () => {
      jest.spyOn(axios, "get").mockResolvedValue(undefined);
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
      => e00a000066035a5258e41d2489571d322189246dafa5ebde1f4699f4980000001200000001304402200ae8634c22762a8ba41d2acb1e068dcce947337c6dd984f13b820d396176952302203306a49d8a6c35b11a61088e1570b3928ca3a0db6bd36f577b5ef87628561ff7
      <= 9000
      => e00400008c058000002c8000003c80000000000000000000000002f8740106843b9aca008504a817c80082520894e41d2489571d322189246dafa5ebde1f4699f498872386f26fc10000b844095ea7b3000000000000000000000000221657776846890989a759ba2973e427dff5c9bb0000000000000000000000000000000000000000000000004563918244f40000c0
      <= 00d6814aa5db69de910824b14462af006fde864224c616ab93e30f646e7309a93f0312ac6e580e918ce6e39e5f910cb95ba7b68167f4d71e581dec2495a198ecc09000
      `),
      );
      const eth = new Eth(transport);
      const result = await signTxWithResolution(
        eth,
        "44'/60'/0'/0/0",
        "02f8740106843b9aca008504a817c80082520894e41d2489571d322189246dafa5ebde1f4699f498872386f26fc10000b844095ea7b3000000000000000000000000221657776846890989a759ba2973e427dff5c9bb0000000000000000000000000000000000000000000000004563918244f40000c0",
      );
      expect(result).toEqual({
        r: "d6814aa5db69de910824b14462af006fde864224c616ab93e30f646e7309a93f",
        s: "0312ac6e580e918ce6e39e5f910cb95ba7b68167f4d71e581dec2495a198ecc0",
        v: "00",
      });
    });

    test("signTransaction supports EIP2930", async () => {
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
      => e004000096058000002c8000003c80000000000000000000000001f886030685012a05f20082520894b2bb2b958afa2e96dab3f3ce7162b87daea39017872386f26fc1000080f85bf85994de0b295669a9fd93d5f28d9ec85e40f4cb697baef842a00000000000000000000000000000000000000000000000000000000000000003a0000000000000000000000000000000000000000000000000
      <= 9000
      => e0048000080000000000000007
      <= 01a74d82400f49d1f9d85f734c22a1648d4ab74bb6367bef54c6abb0936be3d8b77a84a09673394c3c1bd76be05620ee17a2d0ff32837607625efa433cc017854e9000
      `),
      );
      const eth = new Eth(transport);
      const result = await signTxWithResolution(
        eth,
        "44'/60'/0'/0/0",
        "01f886030685012a05f20082520894b2bb2b958afa2e96dab3f3ce7162b87daea39017872386f26fc1000080f85bf85994de0b295669a9fd93d5f28d9ec85e40f4cb697baef842a00000000000000000000000000000000000000000000000000000000000000003a00000000000000000000000000000000000000000000000000000000000000007",
      );
      expect(result).toEqual({
        r: "a74d82400f49d1f9d85f734c22a1648d4ab74bb6367bef54c6abb0936be3d8b7",
        s: "7a84a09673394c3c1bd76be05620ee17a2d0ff32837607625efa433cc017854e",
        v: "01",
      });
    });

    const paraswapAPDUs =
      `=> e0120000670850617261737761701bd435f3c054b6e901b7b108a0ab7617c808677bcfc0afeb304402201c0cbe69aac517825b3a6eb5e7251e8fd57ff93a43bd3df52c7a841818eda81b022001a10cc326efaee2463fc96e7c29739c308fb8179bd2ac37303662bae4f7705c
  <= 9000
  => e00a0000680531494e4348111111111117dc0aa78b770fa6a738034120c3020000001200000001304402204623e5f1375c54a446157ae8a739204284cf053634b7abd083dc5f5d2675c4e702206ff94b4c84ba9e93f44065c38d7c92506621fa69ba04f767aa58221de8afbf17
  <= 9000
  => e004000096058000002c8000003c800000000000000000000000f903cd82043d8509c765240083042e73941bd435f3c054b6e901b7b108a0ab7617c808677b80b903a4cfc0afeb000000000000000000000000111111111117dc0aa78b770fa6a738034120c302000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee0000000000000000000000000000000000000000
  <= 9000
  => e0048000960000000af10f7eb24f506cfd00000000000000000000000000000000000000000000000002a5b905b3c9fa4c00000000000000000000000000000000000000000000000002baaee8d905020a000000000000000000000000000000000000000000000000000000000000018000000000000000000000000000000000000000000000000000000000000001c000000000000000000000
  <= 9000
  => e004800096000000000000000000000000000000000000000002c00000000000000000000000000000000000000000000000000000000000000320000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003600000000000000000000000000000000000000000000000000000000000000000
  <= 9000
  => e004800096000000000000000000000000000000000000000000000000000000000000000100000000000000000000000086d3579b043585a97532514016dcf0c2d6c4b6a100000000000000000000000000000000000000000000000000000000000000c499585aac00000000000000000000000000000000000000000000000af10f7eb24f506cfd000000000000000000000000000000000000
  <= 9000
  => e004800096000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000002000000000000000000000000111111111117dc0aa78b770fa6a738034120c302000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee0000000000000000
  <= 9000
  => e00480009600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c400000000000000000000000000000000000000000000000000000000000000010000
  <= 9000
  => e00480006100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000076c65646765723200000000000000000000000000000000000000000000000000018080
  <= 26d9e62b0b6ae0c18d3d2ecdf20ce7f1c959e0f609b4e73e2d138bbdc3e1e9390012469e2124a8955b5159f670b0333b803a70dd7dc51558a8f7460b27eed77be59000`.toLowerCase();

    test("paraswap", async () => {
      jest.spyOn(axios, "get").mockImplementation(async uri => {
        if (uri?.includes("plugins/ethereum.json")) {
          return {
            data: ParaswapJSON,
          };
        }
        return null;
      });
      const transport = await openTransportReplayer(RecordStore.fromString(paraswapAPDUs));
      const eth = new Eth(transport);
      const result = await signTxWithResolution(
        eth,
        "44'/60'/0'/0/0",
        "f903cd82043d8509c765240083042e73941bd435f3c054b6e901b7b108a0ab7617c808677b80b903a4cfc0afeb000000000000000000000000111111111117dc0aa78b770fa6a738034120c302000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee00000000000000000000000000000000000000000000000af10f7eb24f506cfd00000000000000000000000000000000000000000000000002a5b905b3c9fa4c00000000000000000000000000000000000000000000000002baaee8d905020a000000000000000000000000000000000000000000000000000000000000018000000000000000000000000000000000000000000000000000000000000001c000000000000000000000000000000000000000000000000000000000000002c00000000000000000000000000000000000000000000000000000000000000320000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000086d3579b043585a97532514016dcf0c2d6c4b6a100000000000000000000000000000000000000000000000000000000000000c499585aac00000000000000000000000000000000000000000000000af10f7eb24f506cfd000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000002000000000000000000000000111111111117dc0aa78b770fa6a738034120c302000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c40000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000076c65646765723200000000000000000000000000000000000000000000000000018080",
      );
      expect(result).toEqual({
        r: "d9e62b0b6ae0c18d3d2ecdf20ce7f1c959e0f609b4e73e2d138bbdc3e1e93900",
        s: "12469e2124a8955b5159f670b0333b803a70dd7dc51558a8f7460b27eed77be5",
        v: "26",
      });
    });

    test("paraswap without plugins CDN but with explicit plugin", async () => {
      jest.spyOn(axios, "get").mockImplementation(async uri => {
        if (uri?.includes("plugins/ethereum.json")) {
          return { data: ParaswapJSON };
        }
        return null;
      });
      const transport = await openTransportReplayer(
        // behave like paraswap test
        RecordStore.fromString(paraswapAPDUs),
      );
      const eth = new Eth(transport);
      eth.setLoadConfig({
        pluginBaseURL: null,
        extraPlugins: ParaswapJSON,
      });
      const result = await signTxWithResolution(
        eth,
        "44'/60'/0'/0/0",
        "f903cd82043d8509c765240083042e73941bd435f3c054b6e901b7b108a0ab7617c808677b80b903a4cfc0afeb000000000000000000000000111111111117dc0aa78b770fa6a738034120c302000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee00000000000000000000000000000000000000000000000af10f7eb24f506cfd00000000000000000000000000000000000000000000000002a5b905b3c9fa4c00000000000000000000000000000000000000000000000002baaee8d905020a000000000000000000000000000000000000000000000000000000000000018000000000000000000000000000000000000000000000000000000000000001c000000000000000000000000000000000000000000000000000000000000002c00000000000000000000000000000000000000000000000000000000000000320000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000086d3579b043585a97532514016dcf0c2d6c4b6a100000000000000000000000000000000000000000000000000000000000000c499585aac00000000000000000000000000000000000000000000000af10f7eb24f506cfd000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000002000000000000000000000000111111111117dc0aa78b770fa6a738034120c302000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c40000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000076c65646765723200000000000000000000000000000000000000000000000000018080",
      );
      expect(result).toEqual({
        r: "d9e62b0b6ae0c18d3d2ecdf20ce7f1c959e0f609b4e73e2d138bbdc3e1e93900",
        s: "12469e2124a8955b5159f670b0333b803a70dd7dc51558a8f7460b27eed77be5",
        v: "26",
      });
    });

    test("signTransactionLargeChainID", async () => {
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
      => e004000043058000002c8000003c800000008000000000000000ed018504e3b292008252089428ee52a8f3d6e5d15f8b131996950d7f296c7952872bd72a248740008082aa008080
      <= 1b3694583045a85ada8d15d5e01b373b00e86a405c9c52f7835691dcc522b7353b30392e638a591c65ed307809825ca48346980f52d004ab7a5f93657f7e62a4009000
      `),
      );
      const eth = new Eth(transport);
      const result = await signTxWithResolution(
        eth,
        "44'/60'/0'/0'/0",
        "ed018504e3b292008252089428ee52a8f3d6e5d15f8b131996950d7f296c7952872bd72a248740008082aa008080",
      );
      expect(result).toEqual({
        r: "3694583045a85ada8d15d5e01b373b00e86a405c9c52f7835691dcc522b7353b",
        s: "30392e638a591c65ed307809825ca48346980f52d004ab7a5f93657f7e62a400",
        v: "01542b",
      });
    });

    test("signTransactionLargeChainID2", async () => {
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
      => e004000043058000002c8000003c800000008000000000000000ed018504e3b292008252089428ee52a8f3d6e5d15f8b131996950d7f296c7952872bd72a248740008081fa008080
      <= 173694583045a85ada8d15d5e01b373b00e86a405c9c52f7835691dcc522b7353b30392e638a591c65ed307809825ca48346980f52d004ab7a5f93657f7e62a4009000
      `),
      );
      const eth = new Eth(transport);
      const result = await signTxWithResolution(
        eth,
        "44'/60'/0'/0'/0",
        "ed018504e3b292008252089428ee52a8f3d6e5d15f8b131996950d7f296c7952872bd72a248740008081fa008080",
      );
      expect(result).toEqual({
        r: "3694583045a85ada8d15d5e01b373b00e86a405c9c52f7835691dcc522b7353b",
        s: "30392e638a591c65ed307809825ca48346980f52d004ab7a5f93657f7e62a400",
        v: "0217",
      });
    });

    test("signTransaction5BytesChainID", async () => {
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
      => e00400004c058000002c8000003c800000008000000000000000f8358332d79f85072e9ad0f0830186a094810a9082d51802b2281d23e43e77dd846e51b8ee880194be7d2ebf07b3808502a15c308d8080
      <= 84d86809a5e283da8b967c38a1a6351f8c2bde177858449c26348f8d9ce876681672b0ae2862a68f35edc7a5b84d4a39299b98a4973452acf2c6571e9d4cf702d39000
      `),
      );
      const eth = new Eth(transport);
      const result = await signTxWithResolution(
        eth,
        "44'/60'/0'/0'/0",
        "f8358332d79f85072e9ad0f0830186a094810a9082d51802b2281d23e43e77dd846e51b8ee880194be7d2ebf07b3808502a15c308d8080",
      );
      expect(result).toEqual({
        r: "d86809a5e283da8b967c38a1a6351f8c2bde177858449c26348f8d9ce8766816",
        s: "72b0ae2862a68f35edc7a5b84d4a39299b98a4973452acf2c6571e9d4cf702d3",
        v: "0542b8613e",
      });
    });

    test("signTransactionChunkedLimit", async () => {
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
      => e004000096058000002c8000003c800000000000000000000000f901ad8205448505c205da808310c8e19402b3f51ac9202aa19be63d61a8c681579d6e3a5180b90184293491160000000000000000000000000000000000000000000000000000000005ee832e0000000000000000000000000000000000000000000000000000000005eeb9ac0000000000000000000000000000000000000000
      <= 9000
      => e00480009600000000000000000000000a0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000505846a0a89dd26fa5cd0677fd5406039c218620000000000000000000000000000000000000000000000000000000001f969fc88a4d19062c1525d6ca664dee285aa573c06e0f8bdd4971032d2b63be6183d05300000000000000000000
      <= 9000
      => e004800099000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000041c4c3f1f8711741f2180d850a09a2933bb21dff1c79caf8c45ecda957836ec7e60d78661c28ad96713e5f22a458376422599bd3776d9aeafc02e319ed0c1b41e51c00000000000000000000000000000000000000000000000000000000000000018080
      <= 1bdc6ad1d9d847defdffde2f3b70004c89a1a8a6c614fec484891ae8f1ebc46f9966159ca542f5cf36d64278218bfcce24ba96d7495dec25b10a7609346ca063ec9000
      `), // Incorrect signature but it doesn't matter for tests
      );
      const eth = new Eth(transport);
      const result = await signTxWithResolution(
        eth,
        "44'/60'/0'/0/0",
        "f901ad8205448505c205da808310c8e19402b3f51ac9202aa19be63d61a8c681579d6e3a5180b90184293491160000000000000000000000000000000000000000000000000000000005ee832e0000000000000000000000000000000000000000000000000000000005eeb9ac000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000505846a0a89dd26fa5cd0677fd5406039c218620000000000000000000000000000000000000000000000000000000001f969fc88a4d19062c1525d6ca664dee285aa573c06e0f8bdd4971032d2b63be6183d05300000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000041c4c3f1f8711741f2180d850a09a2933bb21dff1c79caf8c45ecda957836ec7e60d78661c28ad96713e5f22a458376422599bd3776d9aeafc02e319ed0c1b41e51c00000000000000000000000000000000000000000000000000000000000000018080",
      );
      expect(result).toEqual({
        r: "dc6ad1d9d847defdffde2f3b70004c89a1a8a6c614fec484891ae8f1ebc46f99",
        s: "66159ca542f5cf36d64278218bfcce24ba96d7495dec25b10a7609346ca063ec",
        v: "1b",
      });
    });

    test("signTransactionChunkedLimitBigVRS", async () => {
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
      => e004000096058000002c8000003c800000000000000000000000f9011782abcd8609184e72a00082271094aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa820300b8edbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
      <= 9000
      => e004800099bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb258080
      <= 1bdc6ad1d9d847defdffde2f3b70004c89a1a8a6c614fec484891ae8f1ebc46f9966159ca542f5cf36d64278218bfcce24ba96d7495dec25b10a7609346ca063ec9000
      `),
      );
      const eth = new Eth(transport);
      const result = await signTxWithResolution(
        eth,
        "44'/60'/0'/0/0",
        "f9011782abcd8609184e72a00082271094aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa820300b8edbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb258080",
      );
      expect(result).toEqual({
        r: "dc6ad1d9d847defdffde2f3b70004c89a1a8a6c614fec484891ae8f1ebc46f99",
        s: "66159ca542f5cf36d64278218bfcce24ba96d7495dec25b10a7609346ca063ec",
        v: "1b",
      });
    });

    test("signTransaction coin with domain", async () => {
      jest.spyOn(axios, "request").mockImplementationOnce(async ({ url }) => {
        if (url?.includes("dev.0xkvn.eth?challenge=0x10126b3d")) {
          return {
            data: {
              payload:
                "010103020101130103140101120410126b3d21013c200d6465762e30786b766e2e65746822146cbcd73cd8e8a42844662f0a0e76d7f79afd933d15483046022100c8046e9e13a3cb682db70ec5082d9ea9600070ad747433d1088d02102484d1fa022100d77a34953dd7a86d688a9b90f099643b88b18e922b026f7e4fd8db9ab8121a8b",
            },
          };
        }
      });

      const transport = await openTransportReplayer(
        RecordStore.fromString(`
      => e020000000
      <= 10126b3d9000
      => e0220100860084010103020101130103140101120410126b3d21013c200d6465762e30786b766e2e65746822146cbcd73cd8e8a42844662f0a0e76d7f79afd933d15483046022100c8046e9e13a3cb682db70ec5082d9ea9600070ad747433d1088d02102484d1fa022100d77a34953dd7a86d688a9b90f099643b88b18e922b026f7e4fd8db9ab8121a8b
      <= 9000
      => e004000047058000002c8000003c80000000000000000000000002f001468417d784008509051957f0825208946cbcd73cd8e8a42844662f0a0e76d7f79afd933d8801667275be10d51880c0
      <= 00cc0e89a27605a67b3bcb72512c6a48f2b65c7721f9a0dc2591a2a773e1a6d37a149b7a9dce84b9b457300b1b15d1eaa09858e70b6979031cf489c6c0c4507eb29000
      `),
      );
      const eth = new Eth(transport);
      const result = await signTxWithResolution(
        eth,
        "44'/60'/0'/0/0",
        "02f001468417d784008509051957f0825208946cbcd73cd8e8a42844662f0a0e76d7f79afd933d8801667275be10d51880c0",
        {
          erc20: true,
          nft: true,
          externalPlugins: true,
          domains: [
            {
              registry: "ens",
              address: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
              domain: "dev.0xkvn.eth",
              type: "forward",
            },
          ],
        },
      );

      expect(result).toEqual({
        r: "cc0e89a27605a67b3bcb72512c6a48f2b65c7721f9a0dc2591a2a773e1a6d37a",
        s: "149b7a9dce84b9b457300b1b15d1eaa09858e70b6979031cf489c6c0c4507eb2",
        v: "00",
      });
    });

    test("signTransaction erc20 with domain", async () => {
      jest.spyOn(axios, "get").mockResolvedValue(null);
      jest.spyOn(axios, "request").mockImplementationOnce(async ({ url }) => {
        if (url?.includes("dev.0xkvn.eth?challenge=0x1dad95c4")) {
          return {
            data: {
              payload:
                "01010302010113010314010112041dad95c421013c200930786b766e2e6574682214b0b5b0106d69fe64545a60a68c014f7570d3f86115463044022075f4fffb553cb615a6adcecac60ce57f72b5ed76a73b18ca99e8914529efaea70220031df5f609e06d26d1f4b55605f483977e08406528c4ceab729d010d52725dd2",
            },
          };
        }
      });

      const transport = await openTransportReplayer(
        RecordStore.fromString(`
      => e020000000
      <= 1dad95c49000
      => e022010080007e01010302010113010314010112041dad95c421013c200930786b766e2e6574682214b0b5b0106d69fe64545a60a68c014f7570d3f86115463044022075f4fffb553cb615a6adcecac60ce57f72b5ed76a73b18ca99e8914529efaea70220031df5f609e06d26d1f4b55605f483977e08406528c4ceab729d010d52725dd2
      <= 9000
      => e00a000068054d415449437d1afa7b718fb893db30a3abc0cfc608aacfebb000000012000000013044022000d8fa7b6e409a0dc55723ba975179e7d1181d1fc78fccbece4e5a264814366a02203927d84a710c8892d02f7386ad20147c75fba4bdd486b0256ecd005770a7ca5b
      <= 9000
      => e004000085058000002c8000003c80000000000000000000000002f86d0146841dcd650085086a18cd7882fd50947d1afa7b718fb893db30a3abc0cfc608aacfebb080b844a9059cbb000000000000000000000000b0b5b0106d69fe64545a60a68c014f7570d3f8610000000000000000000000000000000000000000000000029784d963dbc85a1ec0
      <= 0030c7d7899a892c9370dc43aa15d309805f52319c32daf22406a42ff32ec6013b746d9409a45b70c6e511d9802cc477cebfd7128140ac649371e988f33f3a85559000
      `),
      );
      const eth = new Eth(transport);
      const result = await signTxWithResolution(
        eth,
        "44'/60'/0'/0/0",
        "02f86d0146841dcd650085086a18cd7882fd50947d1afa7b718fb893db30a3abc0cfc608aacfebb080b844a9059cbb000000000000000000000000b0b5b0106d69fe64545a60a68c014f7570d3f8610000000000000000000000000000000000000000000000029784d963dbc85a1ec0",
        {
          erc20: true,
          nft: true,
          externalPlugins: true,
          domains: [
            {
              registry: "ens",
              address: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
              domain: "dev.0xkvn.eth",
              type: "forward",
            },
          ],
        },
      );

      expect(result).toEqual({
        r: "30c7d7899a892c9370dc43aa15d309805f52319c32daf22406a42ff32ec6013b",
        s: "746d9409a45b70c6e511d9802cc477cebfd7128140ac649371e988f33f3a8555",
        v: "00",
      });
    });

    test("signTransaction NFT with domain", async () => {
      jest.spyOn(axios, "request").mockImplementationOnce(async ({ url }) => {
        if (url?.includes("dev.0xkvn.eth?challenge=0xa8a8b649")) {
          return {
            data: {
              payload:
                "0101030201011301031401011204a8a8b64921013c200930786b766e2e6574682214b0b5b0106d69fe64545a60a68c014f7570d3f86115473045022100dc88dd13819497be8202dbdeddaefd68a1f64ad08855e2f35fc178625a06a7f1022023cdc8ca14233ee4778c81cd26d82e2a5ce27021f8c3cb51bb7d1125313a8cf5",
            },
          };
        }
      });
      jest.spyOn(axios, "get").mockImplementation(async url => {
        if (
          url?.includes("0x60f80121c31a0d46b5279700f9df786054aa5ee5/plugin-selector/0xb88d4fde")
        ) {
          return {
            data: {
              payload:
                "01010645524337323160f80121c31a0d46b5279700f9df786054aa5ee5b88d4fde0000000000000001020147304502206224f90b61a09033d06ee1bd2045fb1f2edd26d479890d253229f3c2a1952aef0221008258bbde083cff7eab1e5b3e9dacccbdcf31232cc45740cb510f7aef00ec766e",
            },
          };
        } else if (
          url?.includes("/ethereum/1/contracts/0x60f80121c31a0d46b5279700f9df786054aa5ee5")
        ) {
          return {
            data: {
              payload:
                "01010752617269626c6560f80121c31a0d46b5279700f9df786054aa5ee5000000000000000101014630440220587a77c4f5e7cc012e4e5e52548790a87c4eb20321249f3ef61e4018b107beeb02206ec8f371023bc15311c4637eb7ba7153fb9e47f1bb7b30db285f4bf9adaa2454",
            },
          };
        }
      });

      const transport = await openTransportReplayer(
        RecordStore.fromString(`
      => e020000000
      <= a8a8b6499000
      => e022010081007f0101030201011301031401011204a8a8b64921013c200930786b766e2e6574682214b0b5b0106d69fe64545a60a68c014f7570d3f86115473045022100dc88dd13819497be8202dbdeddaefd68a1f64ad08855e2f35fc178625a06a7f1022023cdc8ca14233ee4778c81cd26d82e2a5ce27021f8c3cb51bb7d1125313a8cf5
      <= 9000
      => e01600007301010645524337323160f80121c31a0d46b5279700f9df786054aa5ee5b88d4fde0000000000000001020147304502206224f90b61a09033d06ee1bd2045fb1f2edd26d479890d253229f3c2a1952aef0221008258bbde083cff7eab1e5b3e9dacccbdcf31232cc45740cb510f7aef00ec766e
      <= 9000
      => e01400006f01010752617269626c6560f80121c31a0d46b5279700f9df786054aa5ee5000000000000000101014630440220587a77c4f5e7cc012e4e5e52548790a87c4eb20321249f3ef61e4018b107beeb02206ec8f371023bc15311c4637eb7ba7153fb9e47f1bb7b30db285f4bf9adaa2454
      <= 9000
      => e004000096058000002c8000003c80000000000000000000000002f8ee0146841ad27480850912e4364a83023c549460f80121c31a0d46b5279700f9df786054aa5ee580b8c4b88d4fde0000000000000000000000006cbcd73cd8e8a42844662f0a0e76d7f79afd933d000000000000000000000000b0b5b0106d69fe64545a60a68c014f7570d3f8610000000000000000000000000000000000
      <= 9000
      => e004800070000000000000000000000000112999000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000043078303000000000000000000000000000000000000000000000000000000000c0
      <= 01d82878b966f8e6fd94b76c942a7735e4668377f9030285aa2177bf77e59a39347f7908439d2968a8cdb261eae4498dbbf6c5808dc4974fc304486b373001a4349000
      `),
      );
      const eth = new Eth(transport);
      const result = await signTxWithResolution(
        eth,
        "44'/60'/0'/0/0",
        "02f8ee0146841ad27480850912e4364a83023c549460f80121c31a0d46b5279700f9df786054aa5ee580b8c4b88d4fde0000000000000000000000006cbcd73cd8e8a42844662f0a0e76d7f79afd933d000000000000000000000000b0b5b0106d69fe64545a60a68c014f7570d3f8610000000000000000000000000000000000000000000000000000000000112999000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000043078303000000000000000000000000000000000000000000000000000000000c0",
        {
          erc20: true,
          nft: true,
          externalPlugins: true,
          domains: [
            {
              registry: "ens",
              address: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
              domain: "dev.0xkvn.eth",
              type: "forward",
            },
          ],
        },
      );
      jest.clearAllMocks();
      expect(result).toEqual({
        r: "d82878b966f8e6fd94b76c942a7735e4668377f9030285aa2177bf77e59a3934",
        s: "7f7908439d2968a8cdb261eae4498dbbf6c5808dc4974fc304486b373001a434",
        v: "01",
      });
    });

    test("signPersonalMessage", async () => {
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
      => e00800001d058000002c8000003c8000000080000000000000000000000474657374
      <= 1b8beafdd56521af1213d6d668a2aed262cc840e7174b642215aec013a1c88b2bd3a407b9125f1bfc015df6983ae8b87a34d54be367b4275834c3039622a73ee009000
      `),
      );
      const eth = new Eth(transport);
      const result = await eth.signPersonalMessage(
        "44'/60'/0'/0'/0",
        Buffer.from("test").toString("hex"),
      );
      expect(result).toEqual({
        r: "8beafdd56521af1213d6d668a2aed262cc840e7174b642215aec013a1c88b2bd",
        s: "3a407b9125f1bfc015df6983ae8b87a34d54be367b4275834c3039622a73ee00",
        v: 27,
      });
    });

    test("signEIP712HashedMessage", async () => {
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
      => e00c000055058000002c8000003c800000008000000000000000c24f499b8c957196651b13edd64aaccc3980009674b2aea0966c8a56ba81278e9d96be8a7cca396e711a3ba356bd9878df02a726d753ddb6cda3c507d888bc77
      <= 1c47937d12e45197f2f4c47fe34e88944ee10c8e9ee1faf7aa4658f5aab8e0d2bb026c0d81290478fbc45d5bc1308c4b7119ab43d986805413e7f85da5d94597e79000
      `),
      );
      const eth = new Eth(transport);
      const result = await eth.signEIP712HashedMessage(
        "44'/60'/0'/0'/0",
        Buffer.from(
          "c24f499b8c957196651b13edd64aaccc3980009674b2aea0966c8a56ba81278e",
          "hex",
        ).toString("hex"),
        Buffer.from(
          "9d96be8a7cca396e711a3ba356bd9878df02a726d753ddb6cda3c507d888bc77",
          "hex",
        ).toString("hex"),
      );
      expect(result).toEqual({
        r: "47937d12e45197f2f4c47fe34e88944ee10c8e9ee1faf7aa4658f5aab8e0d2bb",
        s: "026c0d81290478fbc45d5bc1308c4b7119ab43d986805413e7f85da5d94597e7",
        v: 28,
      });
    });

    test("provideERC20TokenInformation", async () => {
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
      => e00a000066035a5258e41d2489571d322189246dafa5ebde1f4699f4980000001200000001304402200ae8634c22762a8ba41d2acb1e068dcce947337c6dd984f13b820d396176952302203306a49d8a6c35b11a61088e1570b3928ca3a0db6bd36f577b5ef87628561ff7
      <= 9000
      `),
      );
      const eth = new Eth(transport);
      const zrxInfo = byContractAddressAndChainId("0xe41d2489571d322189246dafa5ebde1f4699f498", 1)!;
      const result = await eth.provideERC20TokenInformation(zrxInfo.data.toString("hex"));
      expect(result).toEqual(true);
    });

    test("starkGetPublicKey", async () => {
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
      => f002000009028000534b00000000
      <= 05e8330615774c27af37530e34aa17e279eb1ac8ac91709932e0a1929bba54ac9000
      `),
      );
      const eth = new Eth(transport);
      const result = await eth.starkGetPublicKey("21323'/0");
      expect(result).toEqual(
        Buffer.from("05e8330615774c27af37530e34aa17e279eb1ac8ac91709932e0a1929bba54ac", "hex"),
      );
    });

    test("starkSignOrderEth", async () => {
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
      => f004010091028000534b000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000010000000100000000000186a00000000000030d4000000d6a00001618
      <= 00029526c310368e835a2a0ee412a3bf084e0f94d91b8265f88a0bee32488223c4012c34bef05a7b80ba22b0d58a18acd1a8198ee8fc9b525f85d2f4f843c5510f9000
      `),
      );
      const eth = new Eth(transport);
      const result = await eth.starkSignOrder(
        "21323'/0",
        null as unknown as string,
        new BigNumber(1),
        null as unknown as string,
        new BigNumber(1),
        1,
        1,
        new BigNumber(100000),
        new BigNumber(200000),
        3434,
        5656,
      );
      expect(result).toEqual({
        r: "029526c310368e835a2a0ee412a3bf084e0f94d91b8265f88a0bee32488223c4",
        s: "012c34bef05a7b80ba22b0d58a18acd1a8198ee8fc9b525f85d2f4f843c5510f",
      });
    });

    test("starkSignOrderEth_v2", async () => {
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
      => f0040300d3028000534b000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000010000000100000000000186a00000000000030d4000000d6a00001618
      <= 00029526c310368e835a2a0ee412a3bf084e0f94d91b8265f88a0bee32488223c4012c34bef05a7b80ba22b0d58a18acd1a8198ee8fc9b525f85d2f4f843c5510f9000
      `),
      );
      const eth = new Eth(transport);
      const result = await eth.starkSignOrder_v2(
        "21323'/0",
        null as unknown as string,
        "eth",
        new BigNumber(1),
        null as unknown as BigNumber,
        null as unknown as string,
        "eth",
        new BigNumber(1),
        null as unknown as BigNumber,
        1,
        1,
        new BigNumber(100000),
        new BigNumber(200000),
        3434,
        5656,
      );
      expect(result).toEqual({
        r: "029526c310368e835a2a0ee412a3bf084e0f94d91b8265f88a0bee32488223c4",
        s: "012c34bef05a7b80ba22b0d58a18acd1a8198ee8fc9b525f85d2f4f843c5510f",
      });
    });

    test("starkSignOrderTokens", async () => {
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
      => e00a000066035a5258e41d2489571d322189246dafa5ebde1f4699f4980000001200000001304402200ae8634c22762a8ba41d2acb1e068dcce947337c6dd984f13b820d396176952302203306a49d8a6c35b11a61088e1570b3928ca3a0db6bd36f577b5ef87628561ff7
      <= 9000
      => e00a0000670455534454dac17f958d2ee523a2206206994597c13d831ec700000006000000013044022078c66ccea3e4dedb15a24ec3c783d7b582cd260daf62fd36afe9a8212a344aed0220160ba8c1c4b6a8aa6565bed20632a091aeeeb7bfdac67fc6589a6031acbf511c
      <= 9000
      => f004010091028000534b00000000e41d2489571d322189246dafa5ebde1f4699f4980000000000000000000000000000000000000000000000000000000000000001dac17f958d2ee523a2206206994597c13d831ec70000000000000000000000000000000000000000000000000000000000000001000000010000000100000000000186a00000000000030d4000000d6a00001618
      <= 0003c4a1aef46539c90eaad9a71eee8319586e2b749793335060a2431c42d0d48901faac9386aaaf9d8d2cc3229aecf9e202f4b83f63e3fff7426ca07725d10fb29000
      `),
      );
      const eth = new Eth(transport);
      const tokenInfo1 = byContractAddressAndChainId(
        "0xe41d2489571d322189246dafa5ebde1f4699f498",
        1,
      )!;
      await eth.provideERC20TokenInformation(tokenInfo1.data.toString("hex"));
      const tokenInfo2 = byContractAddressAndChainId(
        "0xdac17f958d2ee523a2206206994597c13d831ec7",
        1,
      )!;
      await eth.provideERC20TokenInformation(tokenInfo2.data.toString("hex"));
      const result = await eth.starkSignOrder(
        "21323'/0",
        "e41d2489571d322189246dafa5ebde1f4699f498",
        new BigNumber(1),
        "dac17f958d2ee523a2206206994597c13d831ec7",
        new BigNumber(1),
        1,
        1,
        new BigNumber(100000),
        new BigNumber(200000),
        3434,
        5656,
      );
      expect(result).toEqual({
        r: "03c4a1aef46539c90eaad9a71eee8319586e2b749793335060a2431c42d0d489",
        s: "01faac9386aaaf9d8d2cc3229aecf9e202f4b83f63e3fff7426ca07725d10fb2",
      });
    });

    test("starkSignOrderTokens_v2", async () => {
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
      => e00a000066035a5258e41d2489571d322189246dafa5ebde1f4699f4980000001200000001304402200ae8634c22762a8ba41d2acb1e068dcce947337c6dd984f13b820d396176952302203306a49d8a6c35b11a61088e1570b3928ca3a0db6bd36f577b5ef87628561ff7
      <= 9000
      => e00a0000670455534454dac17f958d2ee523a2206206994597c13d831ec700000006000000013044022078c66ccea3e4dedb15a24ec3c783d7b582cd260daf62fd36afe9a8212a344aed0220160ba8c1c4b6a8aa6565bed20632a091aeeeb7bfdac67fc6589a6031acbf511c
      <= 9000
      => f0040300d3028000534b0000000002e41d2489571d322189246dafa5ebde1f4699f4980000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000002dac17f958d2ee523a2206206994597c13d831ec700000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000010000000100000000000186a00000000000030d4000000d6a00001618
      <= 0003c4a1aef46539c90eaad9a71eee8319586e2b749793335060a2431c42d0d48901faac9386aaaf9d8d2cc3229aecf9e202f4b83f63e3fff7426ca07725d10fb29000
      `),
      );
      const eth = new Eth(transport);
      const tokenInfo1 = byContractAddressAndChainId(
        "0xe41d2489571d322189246dafa5ebde1f4699f498",
        1,
      )!;
      await eth.provideERC20TokenInformation(tokenInfo1.data.toString("hex"));
      const tokenInfo2 = byContractAddressAndChainId(
        "0xdac17f958d2ee523a2206206994597c13d831ec7",
        1,
      )!;
      await eth.provideERC20TokenInformation(tokenInfo2.data.toString("hex"));
      const result = await eth.starkSignOrder_v2(
        "21323'/0",
        "e41d2489571d322189246dafa5ebde1f4699f498",
        "erc20",
        new BigNumber(1),
        null as unknown as BigNumber,
        "dac17f958d2ee523a2206206994597c13d831ec7",
        "erc20",
        new BigNumber(1),
        null as unknown as BigNumber,
        1,
        1,
        new BigNumber(100000),
        new BigNumber(200000),
        3434,
        5656,
      );
      expect(result).toEqual({
        r: "03c4a1aef46539c90eaad9a71eee8319586e2b749793335060a2431c42d0d489",
        s: "01faac9386aaaf9d8d2cc3229aecf9e202f4b83f63e3fff7426ca07725d10fb2",
      });
    });

    test("starkSignTransfer1", async () => {
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
      => f004020075028000534b0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001f1f789e47bb134082b2e901f779a0d188af7fbd7d97d10a9e121f22adadb5b05000000010000000100000000000186a000000d6a00001618
      <= 00028c0e3b4d2e7b0c1055c7d40e8df12676bc90cf19d0006225d500baecd5e11c0305fe1782f050839619c3e9627121bacd3a8dc87859e1ba5376fbd1b3bee4d49000
      `),
      );
      const eth = new Eth(transport);
      const result = await eth.starkSignTransfer(
        "21323'/0",
        null as unknown as string,
        new BigNumber(1),
        "f1f789e47bb134082b2e901f779a0d188af7fbd7d97d10a9e121f22adadb5b05",
        1,
        1,
        new BigNumber(100000),
        3434,
        5656,
      );
      expect(result).toEqual({
        r: "028c0e3b4d2e7b0c1055c7d40e8df12676bc90cf19d0006225d500baecd5e11c",
        s: "0305fe1782f050839619c3e9627121bacd3a8dc87859e1ba5376fbd1b3bee4d4",
      });
    });

    test("starkSignTransfer1_v2", async () => {
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
      => f004040096028000534b0000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000f1f789e47bb134082b2e901f779a0d188af7fbd7d97d10a9e121f22adadb5b05000000010000000100000000000186a000000d6a00001618
      <= 00028c0e3b4d2e7b0c1055c7d40e8df12676bc90cf19d0006225d500baecd5e11c0305fe1782f050839619c3e9627121bacd3a8dc87859e1ba5376fbd1b3bee4d49000
      `),
      );
      const eth = new Eth(transport);
      const result = await eth.starkSignTransfer_v2(
        "21323'/0",
        null as unknown as string,
        "eth",
        new BigNumber(1),
        null as unknown as BigNumber,
        "f1f789e47bb134082b2e901f779a0d188af7fbd7d97d10a9e121f22adadb5b05",
        1,
        1,
        new BigNumber(100000),
        3434,
        5656,
      );
      expect(result).toEqual({
        r: "028c0e3b4d2e7b0c1055c7d40e8df12676bc90cf19d0006225d500baecd5e11c",
        s: "0305fe1782f050839619c3e9627121bacd3a8dc87859e1ba5376fbd1b3bee4d4",
      });
    });
    test("starkProvideQuantum", async () => {
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
      => f008000034e41d2489571d322189246dafa5ebde1f4699f4980000000000000000000000000000000000000000000000000000000000000001
      <= 9000
      `),
      );
      const eth = new Eth(transport);
      const result = await eth.starkProvideQuantum(
        "e41d2489571d322189246dafa5ebde1f4699f498",
        new BigNumber(1),
      );
      expect(result).toEqual(true);
    });
    test("starkProvideQuantum_v2", async () => {
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
      => f008010054e41d2489571d322189246dafa5ebde1f4699f49800000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000
      <= 9000
      `),
      );
      const eth = new Eth(transport);
      const result = await eth.starkProvideQuantum_v2(
        "e41d2489571d322189246dafa5ebde1f4699f498",
        "eth",
        new BigNumber(1),
      );
      expect(result).toEqual(true);
    });
    test("starkDepositEth", async () => {
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
      => f00800003400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001
      <= 9000
      => e004000084058000002c8000003c800000000000000000000000f86d018504e3b29200825208940102030405060708090a0b0c0d0e0f1011121314872bd72a24874000b844e2bbb15801142460171646987f20c714eda4b92812b22b811f56f27130937c267e29bd9e0000000000000000000000000000000000000000000000000000000000000001
      <= 1be263d5b15fb088411683ac652f5429173e78bd3f6934a905fbb67f302874d49122b175206744fe898c0f7ed21520e06c919fd9ef61fc5368e62def1f86b991439000
      `),
      );
      const eth = new Eth(transport);
      await eth.starkProvideQuantum(null as unknown as string, new BigNumber(1));
      const result = await signTxWithResolution(
        eth,
        "44'/60'/0'/0/0",
        "f86d018504e3b29200825208940102030405060708090a0b0c0d0e0f1011121314872bd72a24874000b844e2bbb15801142460171646987f20c714eda4b92812b22b811f56f27130937c267e29bd9e0000000000000000000000000000000000000000000000000000000000000001",
      );
      expect(result).toEqual({
        r: "e263d5b15fb088411683ac652f5429173e78bd3f6934a905fbb67f302874d491",
        s: "22b175206744fe898c0f7ed21520e06c919fd9ef61fc5368e62def1f86b99143",
        v: "1b",
      });
    });
    test("starkDepositToken", async () => {
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
      => e00a0000670455534454dac17f958d2ee523a2206206994597c13d831ec700000006000000013044022078c66ccea3e4dedb15a24ec3c783d7b582cd260daf62fd36afe9a8212a344aed0220160ba8c1c4b6a8aa6565bed20632a091aeeeb7bfdac67fc6589a6031acbf511c
      <= 9000
      => f008000034dac17f958d2ee523a2206206994597c13d831ec70000000000000000000000000000000000000000000000000000000000000001
      <= 9000
      => e004000096058000002c8000003c800000000000000000000000f88d018504e3b29200825208940102030405060708090a0b0c0d0e0f1011121314872bd72a24874000b86400aeef8a02ce625e94458d39dd0bf3b45a843544dd4a14b8169045a3a3d15aa564b936c50000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000
      <= 9000
      => e00480000e0000000000000000000000030d40
      <= 1b294214de6341a0a63609f5643700c58be4b7aa46a5f56dea8c9ff5ecf4d5228662a3a4c8a6a0714d147b2a98071cfb892ed3f3edd5da049a2608605970b63dc29000
      `),
      );
      const eth = new Eth(transport);
      const tokenInfo = byContractAddressAndChainId(
        "0xdac17f958d2ee523a2206206994597c13d831ec7",
        1,
      )!;
      await eth.provideERC20TokenInformation(tokenInfo.data.toString("hex"));
      await eth.starkProvideQuantum("0xdac17f958d2ee523a2206206994597c13d831ec7", new BigNumber(1));
      const result = await signTxWithResolution(
        eth,
        "44'/60'/0'/0/0",
        "f88d018504e3b29200825208940102030405060708090a0b0c0d0e0f1011121314872bd72a24874000b86400aeef8a02ce625e94458d39dd0bf3b45a843544dd4a14b8169045a3a3d15aa564b936c500000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000030d40",
      );
      expect(result).toEqual({
        r: "294214de6341a0a63609f5643700c58be4b7aa46a5f56dea8c9ff5ecf4d52286",
        s: "62a3a4c8a6a0714d147b2a98071cfb892ed3f3edd5da049a2608605970b63dc2",
        v: "1b",
      });
    });
    test("starkWithdrawEth", async () => {
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
      => f00800003400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001
      <= 9000
      => e004000063058000002c8000003c800000000000000000000000f84c018504e3b29200825208940102030405060708090a0b0c0d0e0f1011121314872bd72a24874000a42e1a7d4d01142460171646987f20c714eda4b92812b22b811f56f27130937c267e29bd9e
      <= 1b27839551fb3d8b7717ebb02a81308740a6d4b719afa12159b4c41308edc3d82c07c40a39ea0aa3c5114b05f1441de594467e152e7b267a25433236da78d201ee9000
      `),
      );
      const eth = new Eth(transport);
      await eth.starkProvideQuantum(null as unknown as string, new BigNumber(1));
      const result = await signTxWithResolution(
        eth,
        "44'/60'/0'/0/0",
        "f84c018504e3b29200825208940102030405060708090a0b0c0d0e0f1011121314872bd72a24874000a42e1a7d4d01142460171646987f20c714eda4b92812b22b811f56f27130937c267e29bd9e",
      );
      expect(result).toEqual({
        r: "27839551fb3d8b7717ebb02a81308740a6d4b719afa12159b4c41308edc3d82c",
        s: "07c40a39ea0aa3c5114b05f1441de594467e152e7b267a25433236da78d201ee",
        v: "1b",
      });
    });
    test("starkWithdrawToken", async () => {
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
      => e00a0000670455534454dac17f958d2ee523a2206206994597c13d831ec700000006000000013044022078c66ccea3e4dedb15a24ec3c783d7b582cd260daf62fd36afe9a8212a344aed0220160ba8c1c4b6a8aa6565bed20632a091aeeeb7bfdac67fc6589a6031acbf511c
      <= 9000
      => f008000034dac17f958d2ee523a2206206994597c13d831ec70000000000000000000000000000000000000000000000000000000000000001
      <= 9000
      => e004000063058000002c8000003c800000000000000000000000f84c018504e3b29200825208940102030405060708090a0b0c0d0e0f1011121314872bd72a24874000a42e1a7d4d02ce625e94458d39dd0bf3b45a843544dd4a14b8169045a3a3d15aa564b936c5
      <= 1bad0d49ea55b2fd57523ad94698e16acb8b151fa57afd4ae37bb457e9200aac1b53162e87514d7a0ebc383a69f9c27a6abc4ee038f1360b4ffe9cd3f63b4c7f429000
      `),
      );
      const eth = new Eth(transport);
      const tokenInfo = byContractAddressAndChainId(
        "0xdac17f958d2ee523a2206206994597c13d831ec7",
        1,
      )!;
      await eth.provideERC20TokenInformation(tokenInfo.data.toString("hex"));
      await eth.starkProvideQuantum("0xdac17f958d2ee523a2206206994597c13d831ec7", new BigNumber(1));
      const result = await signTxWithResolution(
        eth,
        "44'/60'/0'/0/0",
        "f84c018504e3b29200825208940102030405060708090a0b0c0d0e0f1011121314872bd72a24874000a42e1a7d4d02ce625e94458d39dd0bf3b45a843544dd4a14b8169045a3a3d15aa564b936c5",
      );
      expect(result).toEqual({
        r: "ad0d49ea55b2fd57523ad94698e16acb8b151fa57afd4ae37bb457e9200aac1b",
        s: "53162e87514d7a0ebc383a69f9c27a6abc4ee038f1360b4ffe9cd3f63b4c7f42",
        v: "1b",
      });
    });
    test("starkDepositCancel", async () => {
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
      => f00800003400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001
      <= 9000
      => e004000084058000002c8000003c800000000000000000000000f86d018504e3b29200825208940102030405060708090a0b0c0d0e0f1011121314872bd72a24874000b844c7fb117c01142460171646987f20c714eda4b92812b22b811f56f27130937c267e29bd9e0000000000000000000000000000000000000000000000000000000000000001
      <= 1cb8c4260b5cc4a960f7957806fe4d4f52733b2c0f221ff5a0c09cd0af98471952724ea6b3c70ab0d8c3104ab740c5c7ae6d1a6451f87b3bf7504741136b212eba9000
      `),
      );
      const eth = new Eth(transport);
      await eth.starkProvideQuantum(null as unknown as string, new BigNumber(1));
      const result = await signTxWithResolution(
        eth,
        "44'/60'/0'/0/0",
        "f86d018504e3b29200825208940102030405060708090a0b0c0d0e0f1011121314872bd72a24874000b844c7fb117c01142460171646987f20c714eda4b92812b22b811f56f27130937c267e29bd9e0000000000000000000000000000000000000000000000000000000000000001",
      );
      expect(result).toEqual({
        r: "b8c4260b5cc4a960f7957806fe4d4f52733b2c0f221ff5a0c09cd0af98471952",
        s: "724ea6b3c70ab0d8c3104ab740c5c7ae6d1a6451f87b3bf7504741136b212eba",
        v: "1c",
      });
    });
    test("starkDepositReclaim", async () => {
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
      => f00800003400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001
      <= 9000
      => e004000084058000002c8000003c800000000000000000000000f86d018504e3b29200825208940102030405060708090a0b0c0d0e0f1011121314872bd72a24874000b8444eab38f401142460171646987f20c714eda4b92812b22b811f56f27130937c267e29bd9e0000000000000000000000000000000000000000000000000000000000000001
      <= 1bf80742e1ced6770d846a03b557d37a522c1afe96dcbec24406772d49194c4cba26b3fb49df1d8ac54eda7d5fde3bbe2912fabee6fd535210cb1f08f113e8e5f49000
      `),
      );
      const eth = new Eth(transport);
      await eth.starkProvideQuantum(null as unknown as string, new BigNumber(1));
      const result = await signTxWithResolution(
        eth,
        "44'/60'/0'/0/0",
        "f86d018504e3b29200825208940102030405060708090a0b0c0d0e0f1011121314872bd72a24874000b8444eab38f401142460171646987f20c714eda4b92812b22b811f56f27130937c267e29bd9e0000000000000000000000000000000000000000000000000000000000000001",
      );
      expect(result).toEqual({
        r: "f80742e1ced6770d846a03b557d37a522c1afe96dcbec24406772d49194c4cba",
        s: "26b3fb49df1d8ac54eda7d5fde3bbe2912fabee6fd535210cb1f08f113e8e5f4",
        v: "1b",
      });
    });
    test("starkFullWithdrawal", async () => {
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
      => e004000063058000002c8000003c800000000000000000000000f84c018504e3b29200825208940102030405060708090a0b0c0d0e0f1011121314872bd72a24874000a4276dd1de0000000000000000000000000000000000000000000000000000000000000001
      <= 1b6e1947ab2c9ec22e44af515a24a7453a8431fb2d38ab88fa8971aa0522ec0fa709933014df3bde62ece53e7e7ee8a76d374d6218bd81cb4d1e16ecba29100a6b9000
      `),
      );
      const eth = new Eth(transport);
      const result = await signTxWithResolution(
        eth,
        "44'/60'/0'/0/0",
        "f84c018504e3b29200825208940102030405060708090a0b0c0d0e0f1011121314872bd72a24874000a4276dd1de0000000000000000000000000000000000000000000000000000000000000001",
      );
      expect(result).toEqual({
        r: "6e1947ab2c9ec22e44af515a24a7453a8431fb2d38ab88fa8971aa0522ec0fa7",
        s: "09933014df3bde62ece53e7e7ee8a76d374d6218bd81cb4d1e16ecba29100a6b",
        v: "1b",
      });
    });
    test("starkFreeze", async () => {
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
      => e004000063058000002c8000003c800000000000000000000000f84c018504e3b29200825208940102030405060708090a0b0c0d0e0f1011121314872bd72a24874000a4b91072090000000000000000000000000000000000000000000000000000000000000001
      <= 1b4035b138d55f5be5dab88988ce179e41547412a66b170acd2130d7c851537d717959162e3b8ae5f0ca1869e5887b8886fe71d31be0745c284bf0fdde56d287699000
      `),
      );
      const eth = new Eth(transport);
      const result = await signTxWithResolution(
        eth,
        "44'/60'/0'/0/0",
        "f84c018504e3b29200825208940102030405060708090a0b0c0d0e0f1011121314872bd72a24874000a4b91072090000000000000000000000000000000000000000000000000000000000000001",
      );
      expect(result).toEqual({
        r: "4035b138d55f5be5dab88988ce179e41547412a66b170acd2130d7c851537d71",
        s: "7959162e3b8ae5f0ca1869e5887b8886fe71d31be0745c284bf0fdde56d28769",
        v: "1b",
      });
    });
    test("starkEscapeEth", async () => {
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
      => f00800003400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001
      <= 9000
      => e004000096058000002c8000003c800000000000000000000000f8ad018504e3b29200825208940102030405060708090a0b0c0d0e0f1011121314872bd72a24874000b8849e3adac40000000000000000000000000000000000000000000000000000000000000001010101010101010101010101010101010101010101010101010101010101010101142460171646987f20c714eda4b92812b2
      <= 9000
      => e00480002e2b811f56f27130937c267e29bd9e00000000000000000000000000000000000000000000000000000000000186a0
      <= 1c77220f9513431ecb2eeb53edee025eb78f1fd3c194d75f4988462b78bacd88b43e74b88584f9091a4bdb2605ec128e2bda7eaa262891bf83bb7b34acf22c6a9c9000
      `),
      );
      const eth = new Eth(transport);
      await eth.starkProvideQuantum(null as unknown as string, new BigNumber(1));
      const result = await signTxWithResolution(
        eth,
        "44'/60'/0'/0/0",
        "f8ad018504e3b29200825208940102030405060708090a0b0c0d0e0f1011121314872bd72a24874000b8849e3adac40000000000000000000000000000000000000000000000000000000000000001010101010101010101010101010101010101010101010101010101010101010101142460171646987f20c714eda4b92812b22b811f56f27130937c267e29bd9e00000000000000000000000000000000000000000000000000000000000186a0",
      );
      expect(result).toEqual({
        r: "77220f9513431ecb2eeb53edee025eb78f1fd3c194d75f4988462b78bacd88b4",
        s: "3e74b88584f9091a4bdb2605ec128e2bda7eaa262891bf83bb7b34acf22c6a9c",
        v: "1c",
      });
    });
    test("starkEscapeTokens", async () => {
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
      => e00a0000670455534454dac17f958d2ee523a2206206994597c13d831ec700000006000000013044022078c66ccea3e4dedb15a24ec3c783d7b582cd260daf62fd36afe9a8212a344aed0220160ba8c1c4b6a8aa6565bed20632a091aeeeb7bfdac67fc6589a6031acbf511c
      <= 9000
      => f008000034dac17f958d2ee523a2206206994597c13d831ec70000000000000000000000000000000000000000000000000000000000000001
      <= 9000
      => e004000096058000002c8000003c800000000000000000000000f8ad018504e3b29200825208940102030405060708090a0b0c0d0e0f1011121314872bd72a24874000b8849e3adac40000000000000000000000000000000000000000000000000000000000000001010101010101010101010101010101010101010101010101010101010101010102ce625e94458d39dd0bf3b45a843544dd4a
      <= 9000
      => e00480002e14b8169045a3a3d15aa564b936c50000000000000000000000000000000000000000000000000000000000030d40
      <= 1c56846c1ec5ce862f0abb59054ae9a5279ddac47953907902a0dada43b9a0e06b35ad5523cf0b01efa3a369c24b80cd003f87a2f725cf40ecc2354290fc8369a29000
      `),
      );
      const eth = new Eth(transport);
      const tokenInfo = byContractAddressAndChainId(
        "0xdac17f958d2ee523a2206206994597c13d831ec7",
        1,
      )!;
      await eth.provideERC20TokenInformation(tokenInfo.data.toString("hex"));
      await eth.starkProvideQuantum("0xdac17f958d2ee523a2206206994597c13d831ec7", new BigNumber(1));
      const result = await signTxWithResolution(
        eth,
        "44'/60'/0'/0/0",
        "f8ad018504e3b29200825208940102030405060708090a0b0c0d0e0f1011121314872bd72a24874000b8849e3adac40000000000000000000000000000000000000000000000000000000000000001010101010101010101010101010101010101010101010101010101010101010102ce625e94458d39dd0bf3b45a843544dd4a14b8169045a3a3d15aa564b936c50000000000000000000000000000000000000000000000000000000000030d40",
      );
      expect(result).toEqual({
        r: "56846c1ec5ce862f0abb59054ae9a5279ddac47953907902a0dada43b9a0e06b",
        s: "35ad5523cf0b01efa3a369c24b80cd003f87a2f725cf40ecc2354290fc8369a2",
        v: "1c",
      });
    });
    test("starkEscapeVerify", async () => {
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
      => e004000096058000002c8000003c800000000000000000000000f88d018504e3b29200825208940102030405060708090a0b0c0d0e0f1011121314872bd72a24874000b8642dd5300602ce625e94458d39dd0bf3b45a843544dd4a14b8169045a3a3d15aa564b936c50000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000
      <= 9000
      => e00480000e0000000000000000000000030d40
      <= 1b372586695f148927a74b6ef4b2e40f42b3a6e44afbd16cb4d3dcec6859aec1d2736da27ba0a716492e96ebd6cbbaec894af5cad24a2c6c3f683ade376f9fdc4f9000
      `),
      );
      const eth = new Eth(transport);
      const result = await signTxWithResolution(
        eth,
        "44'/60'/0'/0/0",
        "f88d018504e3b29200825208940102030405060708090a0b0c0d0e0f1011121314872bd72a24874000b8642dd5300602ce625e94458d39dd0bf3b45a843544dd4a14b8169045a3a3d15aa564b936c500000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000030d40",
      );
      expect(result).toEqual({
        r: "372586695f148927a74b6ef4b2e40f42b3a6e44afbd16cb4d3dcec6859aec1d2",
        s: "736da27ba0a716492e96ebd6cbbaec894af5cad24a2c6c3f683ade376f9fdc4f",
        v: "1b",
      });
    });
    test("eth2GetPublicKey", async () => {
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
      => e00e010011040000305d00000e100000000000000000
      <= a0fcd39edaa082bdbf23a0c01568471b8a2bd998c9ae347f7e7690e420bd2f96e436c215422aa86f233f67cbbdfb9b2f9000
      `),
      );
      const eth = new Eth(transport);
      const result = await eth.eth2GetPublicKey("12381/3600/0/0", true);
      expect(result).toEqual({
        publicKey:
          "a0fcd39edaa082bdbf23a0c01568471b8a2bd998c9ae347f7e7690e420bd2f96e436c215422aa86f233f67cbbdfb9b2f",
      });
    });
    test("eth2SetWithdrawalIndex", async () => {
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
      => e01000000400000001
      <= 9000
      `),
      );
      const eth = new Eth(transport);
      const result = await eth.eth2SetWithdrawalIndex(1);
      expect(result).toEqual(true);
    });
    test("getEIP1024PublicEncryptionKey", async () => {
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
      => e018000015058000002c8000003c800000000000000000000000
      <= 2f720080750797da95a41b052cf5694be1be81c0a662d449cd15f946f376e76d9000
      `),
      );
      const eth = new Eth(transport);
      const result = await eth.getEIP1024PublicEncryptionKey("44'/60'/0'/0/0", false);
      expect(result).toEqual({
        publicKey: "2f720080750797da95a41b052cf5694be1be81c0a662d449cd15f946f376e76d",
      });
    });
    test("getEIP1024SharedSecret", async () => {
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
      => e018000135058000002c8000003c8000000000000000000000009ee8bf81321bc2a9e74de286621e13c013b5e4187b1c2fe42b686000672c6f33
      <= 241dc9af8ecae08df6cf899a73a750b43117b50a7f1470405b5ff10adcf49f769000
      `),
      );
      const eth = new Eth(transport);
      const result = await eth.getEIP1024SharedSecret(
        "44'/60'/0'/0/0",
        "9ee8bf81321bc2a9e74de286621e13c013b5e4187b1c2fe42b686000672c6f33",
        false,
      );
      expect(result).toEqual({
        sharedSecret: "241dc9af8ecae08df6cf899a73a750b43117b50a7f1470405b5ff10adcf49f76",
      });
    });
  });
});
