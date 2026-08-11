import { ethers } from "ethers";
import { SendPerfFixture } from "../../engine/fixtureTypes";
import { ANVIL_RPC } from "../../engine/layer1Runner";
import { walletFromMnemonic } from "../../engine/ethHelpers";

export type EthScenarioBuilder = {
  fixture: SendPerfFixture;
  buildSignedTx: (provider: ethers.JsonRpcProvider, walletIndex?: number) => Promise<string>;
};

export async function buildNonceTooLowScenario(
  provider: ethers.JsonRpcProvider,
  walletIndex = 0,
): Promise<string> {
  const wallet = await walletFromMnemonic(provider, walletIndex);
  const tx1 = await wallet.sendTransaction({
    to: wallet.address,
    value: ethers.parseEther("0.01"),
    nonce: 0,
  });
  await tx1.wait();

  const stale = await wallet.signTransaction({
    to: wallet.address,
    value: ethers.parseEther("0.001"),
    nonce: 0,
    gasLimit: 21000n,
    gasPrice: (await provider.getFeeData()).gasPrice ?? 1n,
    chainId: (await provider.getNetwork()).chainId,
  });

  return stale;
}

export async function buildUnderpricedReplacementScenario(
  provider: ethers.JsonRpcProvider,
  walletIndex = 1,
): Promise<string> {
  const wallet = await walletFromMnemonic(provider, walletIndex);
  await provider.send("anvil_setAutomine", [false]);

  const feeData = await provider.getFeeData();
  const gasPrice = feeData.gasPrice ?? ethers.parseUnits("20", "gwei");

  const original = await wallet.signTransaction({
    to: wallet.address,
    value: ethers.parseEther("0.001"),
    nonce: 0,
    gasLimit: 21000n,
    gasPrice,
    chainId: (await provider.getNetwork()).chainId,
    type: 0,
  });

  await provider.send("eth_sendRawTransaction", [original]);

  const lowGasPrice = gasPrice / 4n;
  const replacement = await wallet.signTransaction({
    to: wallet.address,
    value: ethers.parseEther("0.002"),
    nonce: 0,
    gasLimit: 21000n,
    gasPrice: lowGasPrice,
    chainId: (await provider.getNetwork()).chainId,
    type: 0,
  });

  return replacement;
}

export async function buildInsufficientFundsScenario(
  provider: ethers.JsonRpcProvider,
  walletIndex = 2,
): Promise<string> {
  const wallet = await walletFromMnemonic(provider, walletIndex);
  await provider.send("anvil_setBalance", [wallet.address, "0x0"]);

  return wallet.signTransaction({
    to: wallet.address,
    value: ethers.parseEther("1"),
    nonce: 0,
    gasLimit: 21000n,
    gasPrice: (await provider.getFeeData()).gasPrice ?? 1n,
    chainId: (await provider.getNetwork()).chainId,
  });
}

export async function buildIntrinsicGasTooLowScenario(
  provider: ethers.JsonRpcProvider,
  walletIndex = 3,
): Promise<string> {
  const wallet = await walletFromMnemonic(provider, walletIndex);

  return wallet.signTransaction({
    to: wallet.address,
    value: ethers.parseEther("0.001"),
    nonce: 0,
    gasLimit: 1000n,
    gasPrice: (await provider.getFeeData()).gasPrice ?? 1n,
    chainId: (await provider.getNetwork()).chainId,
  });
}

export async function buildAlreadyKnownScenario(
  provider: ethers.JsonRpcProvider,
  walletIndex = 4,
): Promise<string> {
  const wallet = await walletFromMnemonic(provider, walletIndex);
  await provider.send("anvil_setAutomine", [false]);

  const signed = await wallet.signTransaction({
    to: wallet.address,
    value: ethers.parseEther("0.001"),
    nonce: 0,
    gasLimit: 21000n,
    gasPrice: (await provider.getFeeData()).gasPrice ?? 1n,
    chainId: (await provider.getNetwork()).chainId,
    type: 0,
  });

  await provider.send("eth_sendRawTransaction", [signed]);
  return signed;
}

export const ETH_LAYER1_SCENARIOS: EthScenarioBuilder[] = [
  {
    fixture: {
      id: "eth-nonce-too-low-after-mined",
      chain: "ethereum",
      layer: 1,
      description: "Resubmit with stale nonce after original tx mined",
      expectReject: "nonce too low",
      productionWeight: { source: "Errors/ETH.md", count_14d: 47 },
    },
    buildSignedTx: buildNonceTooLowScenario,
  },
  {
    fixture: {
      id: "eth-replacement-underpriced",
      chain: "ethereum",
      layer: 1,
      description: "Same-nonce replacement with lower gas price",
      expectReject: "replacement transaction underpriced",
      productionWeight: { source: "Errors/ETH.md", note: "Open monitoring" },
    },
    buildSignedTx: buildUnderpricedReplacementScenario,
  },
  {
    fixture: {
      id: "eth-insufficient-funds",
      chain: "ethereum",
      layer: 1,
      description: "Zero balance account attempts send",
      expectReject: "insufficient funds",
      productionWeight: { source: "Errors/ETH.md", count_14d: 774 },
    },
    buildSignedTx: buildInsufficientFundsScenario,
  },
  {
    fixture: {
      id: "eth-intrinsic-gas-too-low",
      chain: "ethereum",
      layer: 1,
      description: "Gas limit below EVM minimum for a simple transfer",
      expectReject: "intrinsic gas too low",
      productionWeight: { source: "Errors/ETH.md", note: "LIVE-26166 shipped" },
    },
    buildSignedTx: buildIntrinsicGasTooLowScenario,
  },
  {
    fixture: {
      id: "eth-already-known",
      chain: "ethereum",
      layer: 1,
      description: "Duplicate broadcast of identical signed tx",
      expectReject: "already known",
      productionWeight: { source: "Errors/ETH.md", note: "LIVE-26161 addressed client path" },
    },
    buildSignedTx: buildAlreadyKnownScenario,
  },
];

export const ETH_LAYER2_SCENARIOS = ETH_LAYER1_SCENARIOS.filter(s =>
  ["eth-nonce-too-low-after-mined", "eth-insufficient-funds"].includes(s.fixture.id),
).map((s, index) => ({
  ...s,
  walletIndex: 10 + index,
  fixture: {
      ...s.fixture,
      layer: 2 as const,
      expectErrorClass:
        s.fixture.id === "eth-insufficient-funds"
          ? "InsufficientFunds"
          : s.fixture.id === "eth-nonce-too-low-after-mined"
            ? undefined
            : undefined,
      expectReject:
        s.fixture.id === "eth-insufficient-funds"
          ? "InsufficientFunds"
          : s.fixture.id === "eth-nonce-too-low-after-mined"
            ? "nonce too low"
            : s.fixture.expectReject,
    },
}));

export { ANVIL_RPC };
