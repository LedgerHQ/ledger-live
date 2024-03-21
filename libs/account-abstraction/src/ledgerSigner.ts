// import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
// import Eth from "@ledgerhq/hw-app-eth";
// const eth = new Eth(transport)

import { createWalletClient, http } from 'viem'
import {  
  signMessage, 
  signTransaction, 
  signTypedData, 
  privateKeyToAddress,
  toAccount 
} from 'viem/accounts'
import { mainnet } from 'viem/chains'
 

// export async function getWalletClient({ chainId }) {

// const client = createWalletClient({
//   account,
//   chain: mainnet,
//   transport: http()
// })
// }