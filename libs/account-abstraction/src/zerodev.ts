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
} from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
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
console.log({ PROJECT_ID });
const BUNDLER_RPC = `https://rpc.zerodev.app/api/v2/bundler/${PROJECT_ID}`;
const PAYMASTER_RPC = `https://rpc.zerodev.app/api/v2/paymaster/${PROJECT_ID}`;

const publicClient = createPublicClient({
  transport: http(BUNDLER_RPC),
});

export async function connect(): Promise<{
  saAddress: `0x${string}`;
  // smartAccount: BiconomySmartAccountV2;
} | void> {
  const chain = sepolia;
  const signerViem = signer.toViemAccount();
  const walletClient = createWalletClient({
    // transport: http("https://eth-sepolia.g.alchemy.com/v2/demo"),
    transport: webSocket("wss://ethereum-sepolia-rpc.publicnode.com	"),
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
  });
  console.log({ ACCOUNTFROMSIGNERVIEM: account });

  // Construct a Kernel account client
  const kernelClient = createKernelAccountClient({
    account,
    chain: sepolia,
    transport: http(BUNDLER_RPC),
    sponsorUserOperation: async ({ userOperation }) => {
      const zerodevPaymaster = createZeroDevPaymasterClient({
        chain: sepolia,
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

    console.log(
      `See NFT here: https://mumbai.polygonscan.com/address/${accountAddress}#nfttransfers`,
    );
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
  chainId: string;
  saAddress: string;
  ledgerSigner: any;
};
export async function addLedgerSigner({ chainId, saAddress, ledgerSigner }: addLedgerSignerArgs) {
  console.log("adding ledger signer for ", chainId, saAddress);
  console.log({ledgerSigner})
  const signerViem = signer.toViemAccount();

  // const signerLedger =
  // const weightedECDSAValidator = await createWeightedECDSAValidator(publicClient, {
  //   config: {
  //     threshold: 100,
  //     signers: [
  //       { address: signerViem.address, weight: 100 },
  //       { address: signerLedger.address, weight: 100 },
  //     ],
  //   },
  //   signers: [signerViem, signerLedger],
  // });
}
