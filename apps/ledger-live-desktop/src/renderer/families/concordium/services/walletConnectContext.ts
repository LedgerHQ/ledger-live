import {
  getCreateAccountCreationRequest as getCreateAccountCreationRequestImpl,
  signCredentialTransaction as signCredentialTransactionImpl,
  submitCCDTransaction as submitCCDTransactionImpl,
} from "@ledgerhq/coin-concordium/network/onboard";
import type {
  ConcordiumNetwork,
  ConcordiumWalletConnectContext,
  CredentialDeploymentTransaction,
  IDAppCreateAccountCreationResponse,
} from "@ledgerhq/coin-concordium/types";
import SignClient from "@walletconnect/sign-client";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { SessionTypes } from "@walletconnect/types";
import { walletConnectService } from "./walletConnectService";

class WalletConnectContext implements ConcordiumWalletConnectContext {
  async getClient(): Promise<SignClient> {
    return await walletConnectService.getClient();
  }

  async getSession(network: ConcordiumNetwork): Promise<SessionTypes.Struct | null> {
    return await walletConnectService.getSessionForNetwork(network);
  }

  async request(params: {
    topic: string;
    chainId: string;
    method: string;
    params: { message: unknown };
  }): Promise<unknown> {
    const client = await this.getClient();

    return await client.request({
      topic: params.topic,
      chainId: params.chainId,
      request: {
        method: params.method,
        params: params.params,
      },
    });
  }

  async requestAccountCreation(params: {
    topic: string;
    chainId: string;
    method: string;
    params: { message: unknown };
  }): Promise<IDAppCreateAccountCreationResponse> {
    const client = await this.getClient();

    return await client.request<IDAppCreateAccountCreationResponse>({
      topic: params.topic,
      chainId: params.chainId,
      request: {
        method: "create_account",
        params: params.params,
      },
    });
  }

  async signCredentialTransaction(
    transaction: CredentialDeploymentTransaction,
    signingKey: string,
  ): Promise<{
    credentialDeploymentTransaction: CredentialDeploymentTransaction;
    signature: string;
  }> {
    // Convert CredentialDeploymentTransaction (expiry: bigint) to SerializedCredentialDeploymentDetails (expiry: number)
    const serializedTransaction = {
      expiry: Number(transaction.expiry),
      unsignedCdiStr: transaction.unsignedCdiStr,
      randomness:
        typeof transaction.randomness === "string"
          ? JSON.parse(transaction.randomness)
          : transaction.randomness,
    };

    return await signCredentialTransactionImpl(serializedTransaction, signingKey);
  }

  async submitCCDTransaction(
    credentialDeploymentTransaction: CredentialDeploymentTransaction,
    signature: string,
    currency: CryptoCurrency,
  ): Promise<string> {
    return await submitCCDTransactionImpl(credentialDeploymentTransaction, signature, currency);
  }

  getCreateAccountCreationRequest(publicKey: string, description: string) {
    return getCreateAccountCreationRequestImpl(publicKey, description);
  }

  async initiatePairing(
    _network: ConcordiumNetwork,
    chainId: string,
  ): Promise<{
    uri?: string;
    approval: () => Promise<SessionTypes.Struct>;
  }> {
    await walletConnectService.cleanupExpiredPairingProposals();

    const client = await this.getClient();

    return await client.connect({
      requiredNamespaces: {
        concordium: {
          methods: ["create_account", "recover_account"],
          chains: [chainId],
          events: ["proposal_expire", "session_proposal", "session_event"],
        },
      },
    });
  }

  async disconnectAllSessions(): Promise<void> {
    await walletConnectService.disconnectAllSessions();
  }
}

export const walletConnectContext = new WalletConnectContext();
