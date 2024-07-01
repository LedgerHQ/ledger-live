/********************************************************************************
 *   Ledger Node JS API
 *   (c) 2016-2017 Ledger
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 ********************************************************************************/

export interface TransferTxParams {
  path?: string,
  namespace?: string,
  module?: string,
  recipient: string,
  amount: string,
  chainId: number,
  network: string,
  gasPrice?: string,
  gasLimit?: string,
  creationTime?: number,
  ttl?: string, // Could be decimal
  nonce?: string,
}

export interface TransferCrossChainTxParams extends TransferTxParams {
  recipient_chainId: number,
}

export interface BuildTransactionResult {
  pubkey: string,
  pact_command: PactCommandObject,
};

export interface PactCommandObject {
  cmd: string,
  hash: string,
  sigs: PactCommandSig[],
};

export interface PactCommandSig {
  sig: string,
};
