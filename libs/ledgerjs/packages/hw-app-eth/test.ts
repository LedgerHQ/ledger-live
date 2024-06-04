import EthApp from "./src/Eth";
import { ethers } from "ethers";
import ERC721_ABI from "./tests/fixtures/ABI/ERC721.json";
import ERC1155_ABI from "./tests/fixtures/ABI/ERC1155.json";
import PARASWAP_ABI from "./tests/fixtures/ABI/PARASWAP.json";
import TransportNodeHid from "../hw-transport-node-hid/src/TransportNodeHid";

(async () => {
  const transport = await TransportNodeHid.create(100, 1000);
  const eth = new EthApp(transport);

  const ERC20Tx: ethers.Transaction = {
    to: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    value: ethers.BigNumber.from("0"),
    data: "0xa9059cbb000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045000000000000000000000000000000000000000000000000000000003b0559f4",
    nonce: 0,
    gasLimit: ethers.BigNumber.from("21000"),
    gasPrice: ethers.BigNumber.from("30475312837"),
    chainId: 1,
  };

  const erc721Contract = new ethers.utils.Interface(ERC721_ABI);
  const ERC721Tx: ethers.Transaction = {
    to: "0x60f80121c31a0d46b5279700f9df786054aa5ee5",
    value: ethers.BigNumber.from("0"),
    data: erc721Contract.encodeFunctionData(
      erc721Contract.getFunction("safeTransferFrom(address,address,uint256)"),
      [
        "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
        "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
        "1124761",
      ],
    ),
    nonce: 0,
    gasLimit: ethers.BigNumber.from("21000"),
    gasPrice: ethers.BigNumber.from("30475312837"),
    chainId: 1,
  };

  const erc1155Contract = new ethers.utils.Interface(ERC1155_ABI);
  const ERC1155Tx: ethers.Transaction = {
    to: "0xd07dc4262bcdbf85190c01c996b4c06a461d2430",
    value: ethers.BigNumber.from("0"),
    data: erc1155Contract.encodeFunctionData("safeTransferFrom", [
      "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
      "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
      "263196",
      "1",
      "0x",
    ]),
    nonce: 0,
    gasLimit: ethers.BigNumber.from("21000"),
    gasPrice: ethers.BigNumber.from("30475312837"),
    chainId: 1,
  };

  const paraswapContract = new ethers.utils.Interface(PARASWAP_ABI);
  const paraswapTx: ethers.Transaction = {
    to: "0xdef171fe48cf0115b1d80b88dc8eab59176fee57",
    value: ethers.BigNumber.from("0"),
    data: paraswapContract.encodeFunctionData("simpleSwap", [
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
    nonce: 0,
    gasLimit: ethers.BigNumber.from("21000"),
    gasPrice: ethers.BigNumber.from("30475312837"),
    chainId: 1,
  };

  console.log({ paraswapTx });

  const result = await eth.signTransaction(
    "44'/60'/0'/0/0",
    ethers.utils.serializeTransaction(paraswapTx).slice(2),
    {
      forwardDomain: {
        domain: "vitalik.eth",
        registry: "ens",
      },
    },
  );

  console.log(result);
})();
