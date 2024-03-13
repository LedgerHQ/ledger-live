import { BiconomySmartAccountV2, PaymasterMode, createSmartAccountClient } from "@biconomy/account";
import { sepolia } from "@alchemy/aa-core";
import { Hex, createWalletClient, encodeFunctionData, http, parseAbi, webSocket } from "viem";
import { signer } from ".";
import { getEnv } from "@ledgerhq/live-env";

const AA_BICONOMY_PAYMASTER_APIKEY = getEnv("AA_BICONOMY_PAYMASTER_APIKEY");
const AA_BICONOMY_PAYMASTER_URL = getEnv("AA_BICONOMY_PAYMASTER_URL"); // NOTE: only useful for strict mode https://docs.biconomy.io/Paymaster/integration
const bundlerUrl = `https://bundler.biconomy.io/api/v2/${sepolia.id}/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44`;
// Read about this at https://docs.biconomy.io/dashboard#bundler-url

// biconomy specific can now use signer create via alchemy on either alchemy or biconomy
export async function connect(): Promise<{
  saAddress: `0x${string}`;
  smartAccount: BiconomySmartAccountV2;
}| void> {
  const walletClient = createWalletClient({
    // transport: http("https://eth-sepolia.g.alchemy.com/v2/demo"),
    transport: webSocket("wss://ethereum-sepolia-rpc.publicnode.com	"),
    chain: sepolia,
    account: signer.toViemAccount(),
  });
  const eoa = walletClient.account.address;
  console.log(`EOA address: ${eoa}`);

  if (!walletClient) return;
  // NOTE: careful, same function exists on alchemy
  const smartAccount = await createSmartAccountClient({
    signer: walletClient,
    bundlerUrl,
    biconomyPaymasterApiKey: AA_BICONOMY_PAYMASTER_APIKEY, // <-- Read about at https://docs.biconomy.io/dashboard/paymaster
  });

  const saAddress = await smartAccount.getAccountAddress();
  console.log("SA Address", saAddress);
  return { saAddress, smartAccount };
  // setSaAddress(address);
  // setSmartAccount(biconomySmartAccount);
}

type mintArgs = {
  saAddress: string;
  smartAccount: any;
};

export async function safeMint({
  saAddress,
  smartAccount,
}: mintArgs): Promise<{ transactionHash: string; userOpReceipt: any } | undefined> {
  try {
    const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e";
    const parsedAbi = parseAbi(["function safeMint(address _to)"]);
    const nftData = encodeFunctionData({
      abi: parsedAbi,
      functionName: "safeMint",
      args: [saAddress as Hex],
    });

    // ------ 4. Send transaction
    const userOpResponse = await smartAccount.sendTransaction({
      to: nftAddress,
      data: nftData,
    }, {
      paymasterServiceData: {mode: PaymasterMode.SPONSORED},
    });
    console.log({userOpResponse})
    const { transactionHash } = await userOpResponse.waitForTxHash();
    console.log("transactionHash", transactionHash);
    const userOpReceipt = await userOpResponse.wait();
    console.log({userOpReceipt})
    if (userOpReceipt.success == "true") {
      console.log("UserOp receipt", userOpReceipt);
      console.log("Transaction receipt", userOpReceipt.receipt);
    }
    return {
      transactionHash,
      userOpReceipt,
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Transaction Error:", error.message);
    }
  }
}
