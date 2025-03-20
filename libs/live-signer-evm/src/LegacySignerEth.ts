import { EvmAddress, EvmSigner, EvmSignerEvent } from "@ledgerhq/coin-evm/lib/types/signer";
import Eth from "@ledgerhq/hw-app-eth";
import { EIP712Message } from "@ledgerhq/types-live";
import { ResolutionConfig, LoadConfig } from "@ledgerhq/hw-app-eth/lib/services/types";
import { Observable, map, catchError, from, startWith, throwError } from "rxjs";

export class LegacySignerEth implements EvmSigner {
  private signer: Eth;

  constructor(transport: any) {
    this.signer = new Eth(transport);
  }
  setLoadConfig(loadConfig: LoadConfig) {
    this.signer.setLoadConfig(loadConfig);
  }

  getAddress(
    path: string,
    boolDisplay?: boolean,
    boolChaincode?: boolean,
    chainId?: string,
  ): Promise<EvmAddress> {
    return this.signer.getAddress(path, boolDisplay, boolChaincode, chainId);
  }

  signTransaction(path: string, rawTxHex: string, resolution?: any): Observable<EvmSignerEvent> {
    const observable = from(this.signer.signTransaction(path, rawTxHex, resolution)).pipe(
      map(result => ({ type: "signer.evm.signed", value: result }) as EvmSignerEvent),
      catchError(error => throwError(() => error)),
      startWith({ type: "signer.evm.signing" } as EvmSignerEvent),
    );
    return observable;
  }

  signPersonalMessage(path: string, messageHex: string): Observable<EvmSignerEvent> {
    const observable = from(this.signer.signPersonalMessage(path, messageHex)).pipe(
      map(result => ({ type: "signer.evm.signed", value: result }) as EvmSignerEvent),
      catchError(error => throwError(() => error)),
      startWith({ type: "signer.evm.signing" } as EvmSignerEvent),
    );
    return observable;
  }

  signEIP712Message(
    path: string,
    jsonMessage: EIP712Message,
    fullImplem?: boolean,
  ): Observable<EvmSignerEvent> {
    const observable = from(this.signer.signEIP712Message(path, jsonMessage, fullImplem)).pipe(
      map(result => ({ type: "signer.evm.signed", value: result }) as EvmSignerEvent),
      catchError(error => throwError(() => error)),
      startWith({ type: "signer.evm.signing" } as EvmSignerEvent),
    );
    return observable;
  }

  signEIP712HashedMessage(
    path: string,
    domainSeparatorHex: string,
    hashStructMessageHex: string,
  ): Observable<EvmSignerEvent> {
    const observable = from(
      this.signer.signEIP712HashedMessage(path, domainSeparatorHex, hashStructMessageHex),
    ).pipe(
      map(result => ({ type: "signer.evm.signed", value: result }) as EvmSignerEvent),
      catchError(error => throwError(() => error)),
      startWith({ type: "signer.evm.signing" } as EvmSignerEvent),
    );
    return observable;
  }

  clearSignTransaction(
    path: string,
    rawTxHex: string,
    resolutionConfig: ResolutionConfig,
    throwOnError: boolean,
  ): Observable<EvmSignerEvent> {
    const observable = from(
      this.signer.clearSignTransaction(path, rawTxHex, resolutionConfig, throwOnError),
    ).pipe(
      map(result => ({ type: "signer.evm.signed", value: result }) as EvmSignerEvent),
      catchError(error => throwError(() => error)),
      startWith({ type: "signer.evm.signing" } as EvmSignerEvent),
    );
    return observable;
  }
}
