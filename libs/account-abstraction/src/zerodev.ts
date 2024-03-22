import {
  KernelAccountClient,
  KernelSmartAccount,
  createKernelAccount,
  createKernelAccountClient,
  createZeroDevPaymasterClient,
} from "@zerodev/sdk";
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator";
import {
  http,
  encodeFunctionData,
  parseAbi,
  createWalletClient,
  createPublicClient,
  webSocket,
  Chain,
} from "viem";
import { signer } from ".";
import { createWeightedECDSAValidator } from "@zerodev/weighted-ecdsa-validator";
import { chains, ChainsSupported } from "./chains";

// type KernelClient = ReturnType<typeof createKernelAccountClient>;
type KernelClient = any;
type SmartAccounts = Record<string, Record<string, KernelClient>>;
let smartAccounts: SmartAccounts = {};

function setSmartAccounts(chainId: string, address: string, smartAccount: KernelClient) {
  if (!(chainId in smartAccounts)) {
    smartAccounts[chainId] = {};
  }
  if (!(address in smartAccounts[chainId])) {
    smartAccounts[chainId][address] = smartAccount;
  }
}

export async function connect({ chainName }: { chainName: ChainsSupported }): Promise<{
  saAddress: `0x${string}`;
} | void> {
  const chainData = chains[chainName];
  const publicClient = chainData.client;
  const signerViem = signer.toViemAccount();
  const walletClient = createWalletClient({
    transport: chainData.rpc,
    chain: chainData.chain,
    account: signerViem,
  });
  const eoa = walletClient.account.address;
  console.log(`[connect] EOA address: ${eoa}`);

  if (!walletClient) return;

  // Construct a validator
  const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
    signer: signerViem,
  });
  // Construct a Kernel account
  const account = await createKernelAccount(publicClient, {
    plugins: {
      sudo: ecdsaValidator,
    },
    // index: 2n,
  });
  console.log({ ACCOUNTFROMSIGNERVIEM: account });

  // Construct a Kernel account client
  const kernelClient = createKernelAccountClient({
    account,
    chain: chainData.chain,
    transport: http(chainData.zerodev.bundler),
    sponsorUserOperation: async ({ userOperation }) => {
      const zerodevPaymaster = createZeroDevPaymasterClient({
        chain: chainData.chain,
        transport: http(chainData.zerodev.paymaster),
      });
      return zerodevPaymaster.sponsorUserOperation({
        userOperation,
      });
    },
  });

  const accountAddress = kernelClient.account.address;
  console.log("[connect] My account:", accountAddress);

  setSmartAccounts(`${chainData.id}`, accountAddress, kernelClient);
  console.log({ smartAccounts });
  return { saAddress: accountAddress };
}

// The NFT contract we will be interacting with
const contractAddress = "0x34bE7f35132E97915633BC1fc020364EA5134863";
const contractABI = parseAbi([
  "function mint(address _to) public",
  "function balanceOf(address owner) external view returns (uint256 balance)",
]);

type mintArgs = {
  chainName: ChainsSupported;
  saAddress: string;
};

export async function safeMint({
  chainName,
  saAddress,
}: mintArgs): Promise<{ transactionHash: string } | undefined> {
  try {
    const chainData = chains[chainName];
    const kernelClient = smartAccounts[chainData.id][saAddress];
    console.log({ chainName, saAddress, chainData });
    console.log({ kernelClient });
    const accountAddress = kernelClient.account.address;

    // Send a UserOp
    console.log("[safeMint] Minting NFT...");
    // This function returns the transaction hash of the ERC-4337 bundle that contains the UserOp.
    // Due to the way that ERC-4337 works, by the time we get the transaction hash,
    // the ERC-4337 bundle (and therefore the UserOps includeded within) will have already been mined,
    // meaning that you don't have to wait with the hash.
    const res = await kernelClient.sendTransaction({
      to: contractAddress,
      value: BigInt(0),
      data: encodeFunctionData({
        abi: contractABI,
        functionName: "mint",
        args: [accountAddress],
      }),
    });
    console.log({ resMinting: res });
    console.log(`See NFT here: ${chainData.explorer}/address/${accountAddress}#nfttransfers`);
    // TODO: https://docs.zerodev.app/sdk/getting-started/tutorial#waiting-for-the-userop

    return {
      transactionHash: res,
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("[safeMint] Transaction Error:", error.message);
    }
  }
}

type sendTxArgs = {
  from: string;
  to: `0x${string}`;
  chainId: string;
  value: string;
};
export async function sendTx({ from, chainId, to, value }: sendTxArgs) {
  console.log({ from, chainId, to, value });
  let properChainId = chainId;
  if (`${chainId}` === "137") {
    properChainId = "80001";
  }
  const kernelClient = smartAccounts[`${properChainId}`][from];
  const tx = {
    value,
    to,
  };
  //  returns the transaction hash of the ERC-4337 bundle that contains the UserOp
  const transactionHash = await kernelClient.sendTransaction(tx);
  //   const { transactionHash } = await userOpResponse.waitForTxHash();
  console.log({ transactionHash });
  return {
    transactionHash: transactionHash || "",
  };
}

type addLedgerSignerArgs = {
  chainName: ChainsSupported;
  saAddress: string;
  ledgerSigner: any;
};
export async function addLedgerSigner({ chainName, saAddress, ledgerSigner }: addLedgerSignerArgs) {
  const chainData = chains[chainName];
  const publicClient = chainData.client;
  console.log("[addLedgerSigner] adding ledger signer for ", chainName, saAddress);
  console.log({ chainData, ledgerSigner });
  const signerViem = signer.toViemAccount();

  const weightedECDSAValidator = await createWeightedECDSAValidator(publicClient, {
    config: {
      threshold: 100,
      signers: [
        { address: signerViem.address, weight: 100 },
        { address: ledgerSigner.address, weight: 100 }, // effectively making him the only signer now
      ],
    },
    signers: [signerViem, ledgerSigner], // TODO: swapping changes things (check source code of createWeighted)
  });
  console.log({ weightedECDSAValidator, addA: signerViem.address, addB: ledgerSigner.address });

  // TODO: check if possible of updating instead of creating a whole new account
  const newAccount = await createKernelAccount(publicClient, {
    plugins: {
      sudo: weightedECDSAValidator,
    },
  });
  console.log({ newAccount });

  // Construct a Kernel account client
  const kernelClient = createKernelAccountClient({
    account: newAccount,
    chain: chainData.chain,
    transport: http(chainData.zerodev.bundler),
    sponsorUserOperation: async ({ userOperation }) => {
      const zerodevPaymaster = createZeroDevPaymasterClient({
        chain: chainData.chain,
        transport: http(chainData.zerodev.paymaster),
      });
      return zerodevPaymaster.sponsorUserOperation({
        userOperation,
      });
    },
  });

  const accountAddress = kernelClient.account.address;
  console.log("[addLedgerSigner] My account:", accountAddress);
  setSmartAccounts(`${chainData.id}`, accountAddress, kernelClient);
  console.log({ kernelClient, NEWSMARTACCOUNTS: smartAccounts });
  return { newSaAddress: accountAddress };
}
