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
    console.log({ACCOUNTFROMSIGNERVIEM: account})

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

    console.log({kernelClient})
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
}: mintArgs): Promise<{ transactionHash: string; userOpReceipt: any } | undefined> {
  try {
    // The NFT contract we will be interacting with
    const contractAddress = "0x34bE7f35132E97915633BC1fc020364EA5134863";
    const contractABI = parseAbi([
      "function mint(address _to) public",
      "function balanceOf(address owner) external view returns (uint256 balance)",
    ]);
    const kernelClient = smartAccounts["11155111"][saAddress];
    const accountAddress = kernelClient.account.address;

    // Send a UserOp
    console.log("Minting NFT...");
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

    return {
      transactionHash: "",
      userOpReceipt: {},
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Transaction Error:", error.message);
    }
  }
}
