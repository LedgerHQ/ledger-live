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
import { polygon, sepolia } from "viem/chains";
import { signer } from ".";
import { getEnv } from "@ledgerhq/live-env";
import { createWeightedECDSAValidator } from "@zerodev/weighted-ecdsa-validator";

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

const PROJECT_ID = getEnv("AA_ZERODEV_PROJECTID");
const BUNDLER_RPC_SEPOLIA = `https://rpc.zerodev.app/api/v2/bundler/${PROJECT_ID}`;
const PAYMASTER_RPC_SEPOLIA = `https://rpc.zerodev.app/api/v2/paymaster/${PROJECT_ID}`;

const PROJECT_ID_POLYGON = getEnv("AA_ZERODEV_PROJECTID_POLYGON");
const BUNDLER_RPC_POLYGON = `https://rpc.zerodev.app/api/v2/bundler/${PROJECT_ID_POLYGON}`;
const PAYMASTER_RPC_POLYGON = `https://rpc.zerodev.app/api/v2/paymaster/${PROJECT_ID_POLYGON}`;

const publicClientSepolia = createPublicClient({
  transport: http(BUNDLER_RPC_SEPOLIA),
});

const publicClientPolygon = createPublicClient({
  transport: http(BUNDLER_RPC_POLYGON),
});

export async function connect({ chainName }: { chainName: "sepolia" | "polygon" }): Promise<{
  saAddress: `0x${string}`;
} | void> {
  let publicClient = publicClientSepolia;
  let chain: Chain = sepolia;
  let BUNDLER_RPC = BUNDLER_RPC_SEPOLIA;
  let PAYMASTER_RPC = PAYMASTER_RPC_SEPOLIA;
  // transport: http("https://eth-sepolia.g.alchemy.com/v2/demo"),
  let transport = webSocket("wss://ethereum-sepolia-rpc.publicnode.com"); // TODO: test another one
  if (chainName === "polygon") {
    publicClient = publicClientPolygon;
    chain = polygon;
    transport = webSocket("wss://polygon.gateway.tenderly.co");
    BUNDLER_RPC = BUNDLER_RPC_POLYGON;
    PAYMASTER_RPC = PAYMASTER_RPC_POLYGON;
  }
  console.log({ chain, BUNDLER_RPC, PAYMASTER_RPC, chainName });
  const signerViem = signer.toViemAccount();
  const walletClient = createWalletClient({
    transport,
    chain,
    account: signerViem,
  });
  const eoa = walletClient.account.address;
  console.log(`EOA address: ${eoa}`);

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
    chain,
    transport: http(BUNDLER_RPC),
    sponsorUserOperation: async ({ userOperation }) => {
      const zerodevPaymaster = createZeroDevPaymasterClient({
        chain,
        transport: http(PAYMASTER_RPC),
      });
      return zerodevPaymaster.sponsorUserOperation({
        userOperation,
      });
    },
  });

  console.log({ kernelClient });
  const accountAddress = kernelClient.account.address;
  console.log("My account:", accountAddress);
  const toto = kernelClient.account;

  setSmartAccounts(`${chain.id}`, accountAddress, kernelClient);
  console.log({ smartAccounts });
  // Send a UserOp
  return { saAddress: accountAddress };
}

type mintArgs = {
  chainId: string;
  saAddress: string;
};

export async function safeMint({
  chainId,
  saAddress,
}: mintArgs): Promise<{ transactionHash: string } | undefined> {
  try {
    // The NFT contract we will be interacting with
    const contractAddress = "0x34bE7f35132E97915633BC1fc020364EA5134863";
    const contractABI = parseAbi([
      "function mint(address _to) public",
      "function balanceOf(address owner) external view returns (uint256 balance)",
    ]);
    const kernelClient = smartAccounts[chainId][saAddress];
    console.log({ kernelClient });
    const accountAddress = kernelClient.account.address;

    // Send a UserOp
    console.log("Minting NFT...");
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

    console.log(`See NFT here: https://polygonscan.com/address/${accountAddress}#nfttransfers`);
    console.log({ res });
    // TODO: https://docs.zerodev.app/sdk/getting-started/tutorial#waiting-for-the-userop

    return {
      transactionHash: res,
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Transaction Error:", error.message);
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
  const kernelClient = smartAccounts[`${chainId}`][from];
  // debugger;
  const tx = {
    // @ts-ignore
    value,
    to,
  };
  // @ts-ignore
  //  returns the transaction hash of the ERC-4337 bundle that contains the UserOp
  const transactionHash = await kernelClient.sendTransaction(tx);
  //   const { transactionHash } = await userOpResponse.waitForTxHash();
  console.log({ transactionHash });
  return {
    transactionHash: transactionHash || "",
  };
}

type addLedgerSignerArgs = {
  chainName: "sepolia" | "polygon";
  saAddress: string;
  ledgerSigner: any;
};
export async function addLedgerSigner({ chainName, saAddress, ledgerSigner }: addLedgerSignerArgs) {
  let publicClient = publicClientSepolia;
  let chain: Chain = sepolia;
  let BUNDLER_RPC = BUNDLER_RPC_SEPOLIA;
  let PAYMASTER_RPC = PAYMASTER_RPC_SEPOLIA;
  if (chainName === "polygon") {
    publicClient = publicClientPolygon;
    chain = polygon;
    BUNDLER_RPC = BUNDLER_RPC_POLYGON;
    PAYMASTER_RPC = PAYMASTER_RPC_POLYGON;
  }
  console.log("adding ledger signer for ", chainName, saAddress);
  console.log({ chain, BUNDLER_RPC, PAYMASTER_RPC, chainName, publicClient });
  console.log({ ledgerSigner });
  const signerViem = signer.toViemAccount();

  const weightedECDSAValidator = await createWeightedECDSAValidator(publicClient, {
    config: {
      threshold: 100,
      signers: [
        { address: signerViem.address, weight: 100 },
        { address: ledgerSigner.address, weight: 100 }, // effectively making him the only signer now
      ],
    },
    signers: [ledgerSigner, signerViem], // TODO: swapping changes things (check source code of createWeighted)
  });
  console.log({ weightedECDSAValidator, addA: signerViem.address, addB: ledgerSigner.address });

  // TODO: update instead of creating a whole new account
  const newAccount = await createKernelAccount(publicClient, {
    plugins: {
      sudo: weightedECDSAValidator,
    },
  });
  console.log({ newAccount });

  // Construct a Kernel account client
  const kernelClient = createKernelAccountClient({
    account: newAccount,
    chain,
    transport: http(BUNDLER_RPC),
    sponsorUserOperation: async ({ userOperation }) => {
      const zerodevPaymaster = createZeroDevPaymasterClient({
        chain,
        transport: http(PAYMASTER_RPC),
      });
      return zerodevPaymaster.sponsorUserOperation({
        userOperation,
      });
    },
  });

  console.log({ kernelClient });
  const accountAddress = kernelClient.account.address;
  console.log("My account:", accountAddress);
  setSmartAccounts(`${chain.id}`, accountAddress, kernelClient);
  console.log({ NEWSMARTACCOUNTS: smartAccounts });
  return { newSaAddress: accountAddress };
  // console.log({ smartAccounts });
}
