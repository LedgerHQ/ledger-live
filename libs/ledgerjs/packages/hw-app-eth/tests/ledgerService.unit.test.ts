import axios from "axios";
import { getSerializedTransaction, transactionData, transactionContracts } from "./fixtures/utils";
import { ERC1155_CLEAR_SIGNED_SELECTORS, ERC721_CLEAR_SIGNED_SELECTORS } from "../src/utils";
import partialPluginResponse from "./fixtures/REST/Paraswap-Plugin.json";
import * as contractServices from "../src/services/ledger/contracts";
import { getLoadConfig } from "../src/services/ledger/loadConfig";
import * as erc20Services from "../src/services/ledger/erc20";
import * as nftServices from "../src/services/ledger/nfts";
import signatureCALEth from "./fixtures/SignatureCALEth";
import * as uniswapModule from "../src/modules/Uniswap";
import { ResolutionConfig } from "../src/services/types";
import { ledgerService } from "../src/Eth";

const loadConfig = getLoadConfig();
const resolutionConfig: ResolutionConfig = {
  nft: true,
  erc20: true,
  externalPlugins: true,
  uniswapV3: true,
};

jest.mock("axios");

jest.spyOn(contractServices, "loadInfosForContractMethod");
jest.spyOn(nftServices, "loadNftPlugin");
jest.spyOn(nftServices, "getNFTInfo");
jest.spyOn(erc20Services, "findERC20SignaturesInfo");
jest.spyOn(erc20Services, "byContractAddressAndChainId");
jest.spyOn(uniswapModule, "loadInfosForUniswap");
jest.spyOn(uniswapModule, "getCommandsAndTokensFromUniswapCalldata");

describe("Ledger Service", () => {
  describe("Transaction resolution", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe("ERC20", () => {
      it("should resolve an ERC20 approve", async () => {
        // @ts-expect-error not casted as jest mock
        axios.get.mockImplementation(async () => null);
        const txHash = getSerializedTransaction(
          transactionContracts.erc20,
          transactionData.erc20.approve,
        );
        const resolution = await ledgerService.resolveTransaction(
          txHash,
          loadConfig,
          resolutionConfig,
        );

        expect(resolution).toEqual({
          domains: [],
          erc20Tokens: [
            "0455534443a0b86991c6218b36c1d19d4a2e9eb0ce3606eb4800000006000000013045022100b2e358726e4e6a6752cf344017c0e9d45b9a904120758d45f61b2804f9ad5299022015161ef28d8c4481bd9432c13562def9cce688bcfec896ef244c9a213f106cdd",
          ],
          nfts: [],
          externalPlugin: [],
          plugin: [],
        });
        expect(contractServices.loadInfosForContractMethod).toHaveBeenCalledTimes(1);
        expect(erc20Services.findERC20SignaturesInfo).toHaveBeenCalledTimes(1);
        expect(erc20Services.byContractAddressAndChainId).toHaveBeenCalledTimes(1);
        expect(nftServices.getNFTInfo).toHaveBeenCalledTimes(1);
        expect(nftServices.loadNftPlugin).toHaveBeenCalledTimes(1);
      });

      it("should resolve an ERC20 transfer", async () => {
        // @ts-expect-error not casted as jest mock
        axios.get.mockImplementation(async () => null);
        const txHash = getSerializedTransaction(
          transactionContracts.erc20,
          transactionData.erc20.transfer,
        );
        const resolution = await ledgerService.resolveTransaction(
          txHash,
          loadConfig,
          resolutionConfig,
        );

        expect(resolution).toEqual({
          domains: [],
          erc20Tokens: [
            "0455534443a0b86991c6218b36c1d19d4a2e9eb0ce3606eb4800000006000000013045022100b2e358726e4e6a6752cf344017c0e9d45b9a904120758d45f61b2804f9ad5299022015161ef28d8c4481bd9432c13562def9cce688bcfec896ef244c9a213f106cdd",
          ],
          nfts: [],
          externalPlugin: [],
          plugin: [],
        });
        expect(contractServices.loadInfosForContractMethod).toHaveBeenCalledTimes(1);
        expect(erc20Services.findERC20SignaturesInfo).toHaveBeenCalledTimes(1);
        expect(erc20Services.byContractAddressAndChainId).toHaveBeenCalledTimes(1);
        expect(nftServices.getNFTInfo).not.toHaveBeenCalledTimes(1);
        expect(nftServices.loadNftPlugin).not.toHaveBeenCalledTimes(1);
      });

      it("should not resolve an approve with a non ERC20 or NFT contract", async () => {
        // @ts-expect-error not casted as jest mock
        axios.get.mockImplementation(async () => null);
        const txHash = getSerializedTransaction(
          transactionContracts.random,
          transactionData.erc20.approve,
        );
        const resolution = await ledgerService.resolveTransaction(
          txHash,
          loadConfig,
          resolutionConfig,
        );

        expect(resolution).toEqual({
          domains: [],
          erc20Tokens: [],
          nfts: [],
          externalPlugin: [],
          plugin: [],
        });
        expect(contractServices.loadInfosForContractMethod).toHaveBeenCalledTimes(1);
        expect(erc20Services.findERC20SignaturesInfo).toHaveBeenCalledTimes(1);
        expect(erc20Services.byContractAddressAndChainId).toHaveBeenCalledTimes(1);
        expect(nftServices.getNFTInfo).toHaveBeenCalledTimes(1);
        expect(nftServices.loadNftPlugin).toHaveBeenCalledTimes(1);
      });

      it("should not resolve a transfer with a non ERC20 or NFT contract", async () => {
        // @ts-expect-error not casted as jest mock
        axios.get.mockImplementation(async () => null);
        const txHash = getSerializedTransaction(
          transactionContracts.random,
          transactionData.erc20.transfer,
        );
        const resolution = await ledgerService.resolveTransaction(
          txHash,
          loadConfig,
          resolutionConfig,
        );

        expect(resolution).toEqual({
          domains: [],
          erc20Tokens: [],
          nfts: [],
          externalPlugin: [],
          plugin: [],
        });
        expect(contractServices.loadInfosForContractMethod).toHaveBeenCalledTimes(1);
        expect(erc20Services.findERC20SignaturesInfo).toHaveBeenCalledTimes(1);
        expect(erc20Services.byContractAddressAndChainId).toHaveBeenCalledTimes(1);
        expect(nftServices.getNFTInfo).not.toHaveBeenCalledTimes(1);
        expect(nftServices.loadNftPlugin).not.toHaveBeenCalledTimes(1);
      });
    });

    describe("ERC721", () => {
      const nftAPDU = "nftAPDU";
      const pluginAPDU = "pluginAPDU";

      const nftAxiosMocker = (url: string, selector: string) => {
        if (
          url ===
          `${loadConfig.nftExplorerBaseURL}/1/contracts/${transactionContracts.erc721}/plugin-selector/${selector}`.toLocaleLowerCase()
        ) {
          return {
            data: {
              payload: pluginAPDU,
            },
          };
        } else if (
          url ===
          `${loadConfig.nftExplorerBaseURL}/1/contracts/${transactionContracts.erc721}`.toLocaleLowerCase()
        ) {
          return {
            data: {
              payload: nftAPDU,
            },
          };
        }
        return null;
      };

      it("should resolve an ERC721 approve", async () => {
        // @ts-expect-error not casted as jest mock
        axios.get.mockImplementation(async (url: string) =>
          nftAxiosMocker(url, ERC721_CLEAR_SIGNED_SELECTORS.APPROVE),
        );

        const txHash = getSerializedTransaction(
          transactionContracts.erc721,
          transactionData.erc721.approve,
        );
        const resolution = await ledgerService.resolveTransaction(
          txHash,
          loadConfig,
          resolutionConfig,
        );

        expect(resolution).toEqual({
          domains: [],
          erc20Tokens: [],
          nfts: [nftAPDU],
          externalPlugin: [],
          plugin: [pluginAPDU],
        });
        expect(contractServices.loadInfosForContractMethod).toHaveBeenCalledTimes(1);
        expect(erc20Services.findERC20SignaturesInfo).toHaveBeenCalledTimes(1);
        expect(erc20Services.byContractAddressAndChainId).toHaveBeenCalledTimes(1);
        expect(nftServices.getNFTInfo).toHaveBeenCalledTimes(1);
        expect(nftServices.loadNftPlugin).toHaveBeenCalledTimes(1);
      });

      it("should resolve an ERC721 setApprovalForAll", async () => {
        // @ts-expect-error not casted as jest mock
        axios.get.mockImplementation(async (url: string) =>
          nftAxiosMocker(url, ERC721_CLEAR_SIGNED_SELECTORS.SET_APPROVAL_FOR_ALL),
        );

        const txHash = getSerializedTransaction(
          transactionContracts.erc721,
          transactionData.erc721.setApprovalForAll,
        );
        const resolution = await ledgerService.resolveTransaction(
          txHash,
          loadConfig,
          resolutionConfig,
        );

        expect(resolution).toEqual({
          domains: [],
          erc20Tokens: [],
          nfts: [nftAPDU],
          externalPlugin: [],
          plugin: [pluginAPDU],
        });
        expect(contractServices.loadInfosForContractMethod).toHaveBeenCalledTimes(1);
        expect(erc20Services.findERC20SignaturesInfo).not.toHaveBeenCalled();
        expect(erc20Services.byContractAddressAndChainId).not.toHaveBeenCalled();
        expect(nftServices.getNFTInfo).toHaveBeenCalledTimes(1);
        expect(nftServices.loadNftPlugin).toHaveBeenCalledTimes(1);
      });

      it("should resolve an ERC721 transferFrom", async () => {
        // @ts-expect-error not casted as jest mock
        axios.get.mockImplementation(async (url: string) =>
          nftAxiosMocker(url, ERC721_CLEAR_SIGNED_SELECTORS.TRANSFER_FROM),
        );

        const txHash = getSerializedTransaction(
          transactionContracts.erc721,
          transactionData.erc721.transferFrom,
        );
        const resolution = await ledgerService.resolveTransaction(
          txHash,
          loadConfig,
          resolutionConfig,
        );

        expect(resolution).toEqual({
          domains: [],
          erc20Tokens: [],
          nfts: [nftAPDU],
          externalPlugin: [],
          plugin: [pluginAPDU],
        });
        expect(contractServices.loadInfosForContractMethod).toHaveBeenCalledTimes(1);
        expect(erc20Services.findERC20SignaturesInfo).not.toHaveBeenCalled();
        expect(erc20Services.byContractAddressAndChainId).not.toHaveBeenCalled();
        expect(nftServices.getNFTInfo).toHaveBeenCalledTimes(1);
        expect(nftServices.loadNftPlugin).toHaveBeenCalledTimes(1);
      });

      it("should resolve an ERC721 safeTransferFrom", async () => {
        // @ts-expect-error not casted as jest mock
        axios.get.mockImplementation(async (url: string) =>
          nftAxiosMocker(url, ERC721_CLEAR_SIGNED_SELECTORS.SAFE_TRANSFER_FROM),
        );

        const txHash = getSerializedTransaction(
          transactionContracts.erc721,
          transactionData.erc721.safeTransferFrom,
        );
        const resolution = await ledgerService.resolveTransaction(
          txHash,
          loadConfig,
          resolutionConfig,
        );

        expect(resolution).toEqual({
          domains: [],
          erc20Tokens: [],
          nfts: [nftAPDU],
          externalPlugin: [],
          plugin: [pluginAPDU],
        });
        expect(contractServices.loadInfosForContractMethod).toHaveBeenCalledTimes(1);
        expect(erc20Services.findERC20SignaturesInfo).not.toHaveBeenCalled();
        expect(erc20Services.byContractAddressAndChainId).not.toHaveBeenCalled();
        expect(nftServices.getNFTInfo).toHaveBeenCalledTimes(1);
        expect(nftServices.loadNftPlugin).toHaveBeenCalledTimes(1);
      });

      it("should resolve an ERC721 safeTransferFromWitData", async () => {
        // @ts-expect-error not casted as jest mock
        axios.get.mockImplementation(async (url: string) =>
          nftAxiosMocker(url, ERC721_CLEAR_SIGNED_SELECTORS.SAFE_TRANSFER_FROM_WITH_DATA),
        );

        const txHash = getSerializedTransaction(
          transactionContracts.erc721,
          transactionData.erc721.safeTransferFromWithData,
        );
        const resolution = await ledgerService.resolveTransaction(
          txHash,
          loadConfig,
          resolutionConfig,
        );

        expect(resolution).toEqual({
          domains: [],
          erc20Tokens: [],
          nfts: [nftAPDU],
          externalPlugin: [],
          plugin: [pluginAPDU],
        });
        expect(contractServices.loadInfosForContractMethod).toHaveBeenCalledTimes(1);
        expect(erc20Services.findERC20SignaturesInfo).not.toHaveBeenCalled();
        expect(erc20Services.byContractAddressAndChainId).not.toHaveBeenCalled();
        expect(nftServices.getNFTInfo).toHaveBeenCalledTimes(1);
        expect(nftServices.loadNftPlugin).toHaveBeenCalledTimes(1);
      });

      it("should not resolve a safeTransferFrom from an ERC20 contract", async () => {
        // @ts-expect-error not casted as jest mock
        axios.get.mockImplementation(async (url: string) =>
          nftAxiosMocker(url, ERC721_CLEAR_SIGNED_SELECTORS.SAFE_TRANSFER_FROM),
        );

        const txHash = getSerializedTransaction(
          transactionContracts.erc20,
          transactionData.erc721.safeTransferFrom,
        );
        const resolution = await ledgerService.resolveTransaction(
          txHash,
          loadConfig,
          resolutionConfig,
        );

        expect(resolution).toEqual({
          domains: [],
          erc20Tokens: [],
          nfts: [],
          externalPlugin: [],
          plugin: [],
        });
        expect(contractServices.loadInfosForContractMethod).toHaveBeenCalledTimes(1);
        expect(erc20Services.findERC20SignaturesInfo).not.toHaveBeenCalled();
        expect(erc20Services.byContractAddressAndChainId).not.toHaveBeenCalled();
        expect(nftServices.getNFTInfo).toHaveBeenCalledTimes(1);
        expect(nftServices.loadNftPlugin).toHaveBeenCalledTimes(1);
      });

      it("should not resolve a safeTransferFrom from an random contract", async () => {
        // @ts-expect-error not casted as jest mock
        axios.get.mockImplementation(async (url: string) =>
          nftAxiosMocker(url, ERC721_CLEAR_SIGNED_SELECTORS.SAFE_TRANSFER_FROM),
        );

        const txHash = getSerializedTransaction(
          transactionContracts.random,
          transactionData.erc721.safeTransferFrom,
        );
        const resolution = await ledgerService.resolveTransaction(
          txHash,
          loadConfig,
          resolutionConfig,
        );

        expect(resolution).toEqual({
          domains: [],
          erc20Tokens: [],
          nfts: [],
          externalPlugin: [],
          plugin: [],
        });
        expect(contractServices.loadInfosForContractMethod).toHaveBeenCalledTimes(1);
        expect(erc20Services.findERC20SignaturesInfo).not.toHaveBeenCalled();
        expect(erc20Services.byContractAddressAndChainId).not.toHaveBeenCalled();
        expect(nftServices.getNFTInfo).toHaveBeenCalledTimes(1);
        expect(nftServices.loadNftPlugin).toHaveBeenCalledTimes(1);
      });
    });

    describe("ERC1155", () => {
      const nftAPDU = "nftAPDU";
      const pluginAPDU = "pluginAPDU";

      const nftAxiosMocker = (url: string, selector: string) => {
        if (
          url ===
          `${loadConfig.nftExplorerBaseURL}/1/contracts/${transactionContracts.erc1155}/plugin-selector/${selector}`.toLocaleLowerCase()
        ) {
          return {
            data: {
              payload: pluginAPDU,
            },
          };
        } else if (
          url ===
          `${loadConfig.nftExplorerBaseURL}/1/contracts/${transactionContracts.erc1155}`.toLocaleLowerCase()
        ) {
          return {
            data: {
              payload: nftAPDU,
            },
          };
        }
        return null;
      };

      it("should resolve an ERC1155 setApprovalForAll", async () => {
        // @ts-expect-error not casted as jest mock
        axios.get.mockImplementation(async (url: string) =>
          nftAxiosMocker(url, ERC1155_CLEAR_SIGNED_SELECTORS.SET_APPROVAL_FOR_ALL),
        );

        const txHash = getSerializedTransaction(
          transactionContracts.erc1155,
          transactionData.erc1155.setApprovalForAll,
        );
        const resolution = await ledgerService.resolveTransaction(
          txHash,
          loadConfig,
          resolutionConfig,
        );

        expect(resolution).toEqual({
          domains: [],
          erc20Tokens: [],
          nfts: [nftAPDU],
          externalPlugin: [],
          plugin: [pluginAPDU],
        });
        expect(contractServices.loadInfosForContractMethod).toHaveBeenCalledTimes(1);
        expect(erc20Services.findERC20SignaturesInfo).not.toHaveBeenCalled();
        expect(erc20Services.byContractAddressAndChainId).not.toHaveBeenCalled();
        expect(nftServices.getNFTInfo).toHaveBeenCalledTimes(1);
        expect(nftServices.loadNftPlugin).toHaveBeenCalledTimes(1);
      });

      it("should resolve an ERC1155 safeTransferFrom", async () => {
        // @ts-expect-error not casted as jest mock
        axios.get.mockImplementation(async (url: string) =>
          nftAxiosMocker(url, ERC1155_CLEAR_SIGNED_SELECTORS.SAFE_TRANSFER_FROM),
        );

        const txHash = getSerializedTransaction(
          transactionContracts.erc1155,
          transactionData.erc1155.safeTransferFrom,
        );
        const resolution = await ledgerService.resolveTransaction(
          txHash,
          loadConfig,
          resolutionConfig,
        );

        expect(resolution).toEqual({
          domains: [],
          erc20Tokens: [],
          nfts: [nftAPDU],
          externalPlugin: [],
          plugin: [pluginAPDU],
        });
        expect(contractServices.loadInfosForContractMethod).toHaveBeenCalledTimes(1);
        expect(erc20Services.findERC20SignaturesInfo).not.toHaveBeenCalled();
        expect(erc20Services.byContractAddressAndChainId).not.toHaveBeenCalled();
        expect(nftServices.getNFTInfo).toHaveBeenCalledTimes(1);
        expect(nftServices.loadNftPlugin).toHaveBeenCalledTimes(1);
      });

      it("should resolve an ERC1155 safeBatchTransferFrom", async () => {
        // @ts-expect-error not casted as jest mock
        axios.get.mockImplementation(async (url: string) =>
          nftAxiosMocker(url, ERC1155_CLEAR_SIGNED_SELECTORS.SAFE_BATCH_TRANSFER_FROM),
        );

        const txHash = getSerializedTransaction(
          transactionContracts.erc1155,
          transactionData.erc1155.safeBatchTransferFrom,
        );
        const resolution = await ledgerService.resolveTransaction(
          txHash,
          loadConfig,
          resolutionConfig,
        );

        expect(resolution).toEqual({
          domains: [],
          erc20Tokens: [],
          nfts: [nftAPDU],
          externalPlugin: [],
          plugin: [pluginAPDU],
        });
        expect(contractServices.loadInfosForContractMethod).toHaveBeenCalledTimes(1);
        expect(erc20Services.findERC20SignaturesInfo).not.toHaveBeenCalled();
        expect(erc20Services.byContractAddressAndChainId).not.toHaveBeenCalled();
        expect(nftServices.getNFTInfo).toHaveBeenCalledTimes(1);
        expect(nftServices.loadNftPlugin).toHaveBeenCalledTimes(1);
      });

      it("should not resolve a safeTransferFrom from an ERC20 contract", async () => {
        // @ts-expect-error not casted as jest mock
        axios.get.mockImplementation(async (url: string) =>
          nftAxiosMocker(url, ERC1155_CLEAR_SIGNED_SELECTORS.SAFE_TRANSFER_FROM),
        );

        const txHash = getSerializedTransaction(
          transactionContracts.erc20,
          transactionData.erc1155.safeTransferFrom,
        );
        const resolution = await ledgerService.resolveTransaction(
          txHash,
          loadConfig,
          resolutionConfig,
        );

        expect(resolution).toEqual({
          domains: [],
          erc20Tokens: [],
          nfts: [],
          externalPlugin: [],
          plugin: [],
        });
        expect(contractServices.loadInfosForContractMethod).toHaveBeenCalledTimes(1);
        expect(erc20Services.findERC20SignaturesInfo).not.toHaveBeenCalled();
        expect(erc20Services.byContractAddressAndChainId).not.toHaveBeenCalled();
        expect(nftServices.getNFTInfo).toHaveBeenCalledTimes(1);
        expect(nftServices.loadNftPlugin).toHaveBeenCalledTimes(1);
      });

      it("should not resolve a safeTransferFrom from an random contract", async () => {
        // @ts-expect-error not casted as jest mock
        axios.get.mockImplementation(async (url: string) =>
          nftAxiosMocker(url, ERC1155_CLEAR_SIGNED_SELECTORS.SAFE_TRANSFER_FROM),
        );

        const txHash = getSerializedTransaction(
          transactionContracts.random,
          transactionData.erc1155.safeTransferFrom,
        );
        const resolution = await ledgerService.resolveTransaction(
          txHash,
          loadConfig,
          resolutionConfig,
        );

        expect(resolution).toEqual({
          domains: [],
          erc20Tokens: [],
          nfts: [],
          externalPlugin: [],
          plugin: [],
        });
        expect(contractServices.loadInfosForContractMethod).toHaveBeenCalledTimes(1);
        expect(erc20Services.findERC20SignaturesInfo).not.toHaveBeenCalled();
        expect(erc20Services.byContractAddressAndChainId).not.toHaveBeenCalled();
        expect(nftServices.getNFTInfo).toHaveBeenCalledTimes(1);
        expect(nftServices.loadNftPlugin).toHaveBeenCalledTimes(1);
      });
    });

    describe("EXTERNAL PLUGINS", () => {
      describe("Paraswap", () => {
        it("should resolve a simple swap from Paraswap", async () => {
          // @ts-expect-error not casted as jest mock
          axios.get.mockImplementation(async (url: string) => {
            if (url === "https://cdn.live.ledger.com/plugins/ethereum.json") {
              return { data: partialPluginResponse };
            }
            return null;
          });

          const txHash = getSerializedTransaction(
            transactionContracts.paraswap,
            transactionData.paraswap.simpleSwap,
          );
          const resolution = await ledgerService.resolveTransaction(
            txHash,
            loadConfig,
            resolutionConfig,
          );

          expect(resolution).toEqual({
            domains: [],
            erc20Tokens: [
              "054d415449437d1afa7b718fb893db30a3abc0cfc608aacfebb000000012000000013044022000d8fa7b6e409a0dc55723ba975179e7d1181d1fc78fccbece4e5a264814366a02203927d84a710c8892d02f7386ad20147c75fba4bdd486b0256ecd005770a7ca5b",
              "034441496b175474e89094c44da98b954eedeac495271d0f00000012000000013045022100b3aa979633284eb0f55459099333ab92cf06fdd58dc90e9c070000c8e968864c02207b10ec7d6609f51dda53d083a6e165a0abf3a77e13250e6f260772809b49aff5",
            ],
            nfts: [],
            externalPlugin: [
              {
                payload: "085061726173776170def171fe48cf0115b1d80b88dc8eab59176fee5754e3f31b",
                signature:
                  "3045022100ec8e69d23371437ce5b5f1d894b836c036748e2fabf52fb069c34a9d0ba8704a022013e761d81c26ece4cb0ea385813699b7e646354d3404ed55f4bf068db02dda9a",
              },
            ],
            plugin: [],
          });
          expect(contractServices.loadInfosForContractMethod).toHaveBeenCalledTimes(1);
          expect(erc20Services.findERC20SignaturesInfo).toHaveBeenCalledTimes(2);
          expect(erc20Services.byContractAddressAndChainId).toHaveBeenCalledTimes(2);
          expect(nftServices.getNFTInfo).not.toHaveBeenCalled();
          expect(nftServices.loadNftPlugin).not.toHaveBeenCalled();
        });

        it("should resolve a swap on uniswapV2 fork from Paraswap", async () => {
          // @ts-expect-error not casted as jest mock
          axios.get.mockImplementation(async (url: string) => {
            if (url === "https://cdn.live.ledger.com/plugins/ethereum.json") {
              return { data: partialPluginResponse };
            }
            return null;
          });

          const txHash = getSerializedTransaction(
            transactionContracts.paraswap,
            transactionData.paraswap.swapOnUniswapV2Fork,
          );
          const resolution = await ledgerService.resolveTransaction(
            txHash,
            loadConfig,
            resolutionConfig,
          );

          expect(resolution).toEqual({
            domains: [],
            erc20Tokens: [
              "054d415449437d1afa7b718fb893db30a3abc0cfc608aacfebb000000012000000013044022000d8fa7b6e409a0dc55723ba975179e7d1181d1fc78fccbece4e5a264814366a02203927d84a710c8892d02f7386ad20147c75fba4bdd486b0256ecd005770a7ca5b",
            ],
            nfts: [],
            externalPlugin: [
              {
                payload: "085061726173776170def171fe48cf0115b1d80b88dc8eab59176fee570b86a4c1",
                signature:
                  "3045022100832052e09afece789911f4310118e40fbd04d16961257423435f29d43de7193a02203610a035156139cb63873317eba79365592de5fdb60da9b5735492a69f67bb00",
              },
            ],
            plugin: [],
          });
          expect(contractServices.loadInfosForContractMethod).toHaveBeenCalledTimes(1);
          expect(erc20Services.findERC20SignaturesInfo).toHaveBeenCalledTimes(1);
          expect(erc20Services.byContractAddressAndChainId).toHaveBeenCalledTimes(1);
          expect(nftServices.getNFTInfo).not.toHaveBeenCalled();
          expect(nftServices.loadNftPlugin).not.toHaveBeenCalled();
        });
      });
    });

    describe("UNISWAP", () => {
      it("should resolve a Uniswap universal router transaction (permit2>swap-out-v3>unwrap)", async () => {
        // @ts-expect-error not casted as jest mock
        axios.get.mockImplementation(async (uri: string) => {
          if (uri.endsWith("evm/1/erc20-signatures.json")) {
            return { data: signatureCALEth };
          }
          return null;
        });

        const txHash = getSerializedTransaction(
          transactionContracts.uniswapUniversaRouter,
          transactionData.uniswap["permit2>swap-out-v3>unwrap"],
        );
        const resolution = await ledgerService.resolveTransaction(
          txHash,
          loadConfig,
          resolutionConfig,
        );

        expect(resolution).toEqual({
          domains: [],
          erc20Tokens: [
            "0457455448c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000012000000013045022100b47ee8551c15a2cf681c649651e987d7e527c481d27c38da1f971a8242792bd3022069c3f688ac5493a23dab5798e3c9b07484765069e1d4be14321aae4d92cb8cbe",
            "0457455448c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000012000000013045022100b47ee8551c15a2cf681c649651e987d7e527c481d27c38da1f971a8242792bd3022069c3f688ac5493a23dab5798e3c9b07484765069e1d4be14321aae4d92cb8cbe",
          ],
          nfts: [],
          externalPlugin: [
            {
              payload:
                "07556e69737761703fc91a3afd70395cd496c647d5a6cc9d4b2b7fad3593564c3044022014391e8f355867a57fe88f6a5a4dbcb8bf8f888a9db3ff3449caf72d120396bd02200c13d9c3f79400fe0aa0434ac54d59b79503c9964a4abc3e8cd22763e0242935",
              signature: "",
            },
          ],
          plugin: [],
        });
        expect(contractServices.loadInfosForContractMethod).toHaveBeenCalledTimes(0);
        expect(erc20Services.findERC20SignaturesInfo).toHaveBeenCalledTimes(3);
        expect(erc20Services.byContractAddressAndChainId).toHaveBeenCalledTimes(3);
        expect(uniswapModule.loadInfosForUniswap).toHaveBeenCalledTimes(1);
        expect(uniswapModule.getCommandsAndTokensFromUniswapCalldata).toHaveBeenCalledTimes(1);
        expect(nftServices.getNFTInfo).not.toHaveBeenCalled();
        expect(nftServices.loadNftPlugin).not.toHaveBeenCalled();
      });
      it("should resolve a Uniswap universal router transaction (wrap>swap-in-v3)", async () => {
        // @ts-expect-error not casted as jest mock
        axios.get.mockImplementation(async (uri: string) => {
          if (uri.endsWith("evm/1/erc20-signatures.json")) {
            return { data: signatureCALEth };
          }
          return null;
        });

        const txHash = getSerializedTransaction(
          transactionContracts.uniswapUniversaRouter,
          transactionData.uniswap["wrap>swap-in-v3"],
        );
        const resolution = await ledgerService.resolveTransaction(
          txHash,
          loadConfig,
          resolutionConfig,
        );

        expect(resolution).toEqual({
          domains: [],
          erc20Tokens: [
            "0457455448c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000012000000013045022100b47ee8551c15a2cf681c649651e987d7e527c481d27c38da1f971a8242792bd3022069c3f688ac5493a23dab5798e3c9b07484765069e1d4be14321aae4d92cb8cbe",
            "0457455448c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000012000000013045022100b47ee8551c15a2cf681c649651e987d7e527c481d27c38da1f971a8242792bd3022069c3f688ac5493a23dab5798e3c9b07484765069e1d4be14321aae4d92cb8cbe",
          ],
          nfts: [],
          externalPlugin: [
            {
              payload:
                "07556e69737761703fc91a3afd70395cd496c647d5a6cc9d4b2b7fad3593564c3044022014391e8f355867a57fe88f6a5a4dbcb8bf8f888a9db3ff3449caf72d120396bd02200c13d9c3f79400fe0aa0434ac54d59b79503c9964a4abc3e8cd22763e0242935",
              signature: "",
            },
          ],
          plugin: [],
        });
        expect(contractServices.loadInfosForContractMethod).toHaveBeenCalledTimes(0);
        expect(erc20Services.findERC20SignaturesInfo).toHaveBeenCalledTimes(3);
        expect(erc20Services.byContractAddressAndChainId).toHaveBeenCalledTimes(3);
        expect(uniswapModule.loadInfosForUniswap).toHaveBeenCalledTimes(1);
        expect(uniswapModule.getCommandsAndTokensFromUniswapCalldata).toHaveBeenCalledTimes(1);
        expect(nftServices.getNFTInfo).not.toHaveBeenCalled();
        expect(nftServices.loadNftPlugin).not.toHaveBeenCalled();
      });
    });
  });
});
