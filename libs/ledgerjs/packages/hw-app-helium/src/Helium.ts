import Transport from "@ledgerhq/hw-transport";
import { StatusCodes } from "@ledgerhq/errors";
import Address from "@helium/address";
import {
  PaymentV2,
  SecurityExchangeV1,
  StakeValidatorV1,
  TokenBurnV1,
  TransferValidatorStakeV1,
  UnstakeValidatorV1,
} from "@helium/transactions";
import proto from "@helium/proto";
import {
  pathToBuffer,
  serializePaymentV2,
  serializeSecurityExchangeV1,
  serializeStakeValidatorV1,
  serializeTokenBurnV1,
  serializeTransferValidatorStakeV1,
  serializeUnstakeValidatorV1,
} from "./serialization";

const P1_NON_CONFIRM = 0x00;
const P1_CONFIRM = 0x01;

const LEDGER_CLA = 0xe0;
const CLA_OFFSET = 0x00;

const INS = {
  GET_VERSION: 0x01,
  GET_ADDR: 0x02,
  SIGN_PAYMENT: 0x08,
  SIGN_VALIDATOR_STAKE: 0x09,
  SIGN_VALIDATOR_TXFER: 0x0a,
  SIGN_VALIDATOR_UNSTAKE: 0x0b,
  SIGN_TOKEN_BURN: 0x0c,
  SIGN_TRANSFER_SEC_TXN: 0x0d,
};

/**
 * Helium API
 *
 * @param transport a transport for sending commands to a device
 * @param scrambleKey a scramble key
 *
 * @example
 * import Helium from "@ledgerhq/hw-app-helium";
 * const helium = new Helium(transport);
 */
export default class Helium {
  private transport: Transport;

  constructor(
    transport: Transport,
    scrambleKey = "helium_default_scramble_key"
  ) {
    this.transport = transport;
    this.transport.decorateAppAPIMethods(
      this,
      [
        "getVersion",
        "getAddress",
        "signPaymentV2",
        "signTokenBurnV1",
        "signStakeValidatorV1",
        "signUnstakeValidatorV1",
        "signTransferValidatorStakeV1",
      ],
      scrambleKey
    );
  }

  /**
   * Get application version.
   *
   * @returns version object
   *
   * @example
   * helium.getVersion().then(r => r.version)
   */
  async getVersion(): Promise<{ version: string }> {
    const [major, minor, patch] = await this.sendToDevice(
      INS.GET_VERSION,
      P1_NON_CONFIRM,
      0,
      Buffer.from([])
    );

    return {
      version: `${major}.${minor}.${patch}`,
    };
  }

  /**
   * Get Helium address (public key) for a BIP32 path.
   *
   * @param path a BIP32 path
   * @param display flag to show display
   * @param accountIndex index of account address
   * @returns an object with the address field
   *
   * @example
   * helium.getAddress("44'/904'/0'/0'/0'").then(r => r.address)
   */
  async getAddress(
    path: string,
    display?: boolean,
    accountIndex = 0
  ): Promise<{ index: number; address: string; publicKey: string }> {
    const pathBuffer = pathToBuffer(path);

    const addressBuffer = await this.sendToDevice(
      INS.GET_ADDR,
      display ? P1_CONFIRM : P1_NON_CONFIRM,
      accountIndex,
      pathBuffer
    );

    const address = Address.fromBin(addressBuffer.slice(1, 34));

    return {
      index: addressBuffer.slice(0, 1)[0],
      address: address.b58,
      publicKey: Buffer.from(address.publicKey).toString("hex"),
    };
  }

  /**
   * Sign a Helium `PaymentV2` transaction.
   *
   * @param txn a PaymentV2 transaction
   * @param accountIndex index of account address
   *
   * @returns an object with the signed transaction and signature
   *
   * @example
   * import { PaymentV2 } from '@helium/transactions'
   * const txn = new PaymentV2({ ... })
   * helium.signTransaction(txn).then(r => r.signature)
   */
  async signPaymentV2(
    txn: PaymentV2,
    accountIndex = 0
  ): Promise<{ signature: Buffer; txn: PaymentV2 }> {
    const payload = serializePaymentV2(txn);

    const response = await this.sendToDevice(
      INS.SIGN_PAYMENT,
      accountIndex,
      CLA_OFFSET,
      payload
    );

    if (response.length === 1) throw "User has declined.";

    const decoded = proto.helium.blockchain_txn_payment_v2.decode(response);
    const signature = decoded.signature as Buffer;

    txn.signature = signature;

    return {
      signature,
      txn,
    };
  }

  /**
   * Sign a Helium `TokenBurnV1` transaction.
   *
   * @param txn a TokenBurnV1 transaction
   * @param accountIndex index of account address
   *
   * @returns an object with the signed transaction and signature
   *
   * @example
   * import { TokenBurnV1 } from '@helium/transactions'
   * const txn = new TokenBurnV1({ ... })
   * helium.signTransaction(txn).then(r => r.signature)
   */
  async signTokenBurnV1(
    txn: TokenBurnV1,
    accountIndex = 0
  ): Promise<{ signature: Buffer; txn: TokenBurnV1 }> {
    const payload = serializeTokenBurnV1(txn);

    const response = await this.sendToDevice(
      INS.SIGN_TOKEN_BURN,
      accountIndex,
      CLA_OFFSET,
      payload
    );

    if (response.length === 1) throw "User has declined.";

    const decoded = proto.helium.blockchain_txn_token_burn_v1.decode(response);
    const signature = decoded.signature as Buffer;

    txn.signature = signature;

    return {
      signature,
      txn,
    };
  }

  /**
   * Sign a Helium `StakeValidatorV1` transaction.
   *
   * @param txn a StakeValidatorV1 transaction
   * @param accountIndex index of account address
   *
   * @returns an object with the signed transaction and signature
   *
   * @example
   * import { StakeValidatorV1 } from '@helium/transactions'
   * const txn = new StakeValidatorV1({ ... })
   * helium.signTransaction(txn).then(r => r.signature)
   */
  async signStakeValidatorV1(
    txn: StakeValidatorV1,
    accountIndex = 0
  ): Promise<{ signature: Buffer; txn: StakeValidatorV1 }> {
    const payload = serializeStakeValidatorV1(txn);

    const response = await this.sendToDevice(
      INS.SIGN_VALIDATOR_STAKE,
      accountIndex,
      CLA_OFFSET,
      payload
    );

    if (response.length === 1) throw "User has declined.";

    const decoded =
      proto.helium.blockchain_txn_stake_validator_v1.decode(response);
    const signature = decoded.ownerSignature as Buffer;

    txn.ownerSignature = signature;

    return {
      signature,
      txn,
    };
  }

  /**
   * Sign a Helium `UnstakeValidatorV1` transaction.
   *
   * @param txn a UnstakeValidatorV1 transaction
   * @param accountIndex index of account address
   *
   * @returns an object with the signed transaction and signature
   *
   * @example
   * import { UnstakeValidatorV1 } from '@helium/transactions'
   * const txn = new UnstakeValidatorV1({ ... })
   * helium.signTransaction(txn).then(r => r.signature)
   */
  async signUnstakeValidatorV1(
    txn: UnstakeValidatorV1,
    accountIndex = 0
  ): Promise<{ signature: Buffer; txn: UnstakeValidatorV1 }> {
    const payload = serializeUnstakeValidatorV1(txn);

    const response = await this.sendToDevice(
      INS.SIGN_VALIDATOR_UNSTAKE,
      accountIndex,
      CLA_OFFSET,
      payload
    );

    if (response.length === 1) throw "User has declined.";

    const decoded =
      proto.helium.blockchain_txn_unstake_validator_v1.decode(response);
    const signature = decoded.ownerSignature as Buffer;

    txn.ownerSignature = signature;

    return {
      signature,
      txn,
    };
  }

  /**
   * Sign a Helium `TransferValidatorStakeV1` transaction.
   *
   * @param txn a TransferValidatorStakeV1 transaction
   * @param ownerType whether to sign as the old or new owner in the transfer
   * @param accountIndex index of account address
   *
   * @returns an object with the signed transaction and signature
   *
   * @example
   * import { TransferValidatorStakeV1 } from '@helium/transactions'
   * const txn = new TransferValidatorStakeV1({ ... }, 'old')
   * helium.signTransaction(txn).then(r => r.signature)
   */
  async signTransferValidatorStakeV1(
    txn: TransferValidatorStakeV1,
    ownerType: "old" | "new",
    accountIndex = 0
  ): Promise<{ signature: Buffer; txn: TransferValidatorStakeV1 }> {
    const payload = serializeTransferValidatorStakeV1(txn);

    const response = await this.sendToDevice(
      INS.SIGN_VALIDATOR_TXFER,
      accountIndex,
      CLA_OFFSET,
      payload
    );

    if (response.length === 1) throw "User has declined.";

    const decoded =
      proto.helium.blockchain_txn_transfer_validator_stake_v1.decode(response);
    const signature = decoded.oldOwnerSignature as Buffer;

    if (ownerType === "old") {
      txn.oldOwnerSignature = signature;
    }

    if (ownerType === "new") {
      txn.newOwnerSignature = signature;
    }

    return {
      signature,
      txn,
    };
  }

  /**
   * Sign a Helium `SecurityExchangeV1` transaction.
   *
   * @param txn a SecurityExchangeV1 transaction
   * @param accountIndex index of account address
   *
   * @returns an object with the signed transaction and signature
   *
   * @example
   * import { SecurityExchangeV1 } from '@helium/transactions'
   * const txn = new SecurityExchangeV1({ ... })
   * helium.signTransaction(txn).then(r => r.signature)
   */
  async signSecurityExchangeV1(
    txn: SecurityExchangeV1,
    accountIndex = 0
  ): Promise<{ signature: Buffer; txn: SecurityExchangeV1 }> {
    const payload = serializeSecurityExchangeV1(txn);

    const response = await this.sendToDevice(
      INS.SIGN_TRANSFER_SEC_TXN,
      accountIndex,
      CLA_OFFSET,
      payload
    );

    if (response.length === 1) throw "User has declined.";

    const decoded =
      proto.helium.blockchain_txn_security_exchange_v1.decode(response);
    const signature = decoded.signature as Buffer;

    txn.signature = signature;

    return {
      signature,
      txn,
    };
  }

  private async sendToDevice(
    instruction: number,
    p1: number,
    p2 = 0x00,
    payload: Buffer
  ) {
    const acceptStatusList = [StatusCodes.OK];

    const reply = await this.transport.send(
      LEDGER_CLA,
      instruction,
      p1,
      p2,
      payload,
      acceptStatusList
    );

    this.throwOnFailure(reply);

    return reply.slice(0, reply.length - 2);
  }

  private throwOnFailure(reply: Buffer) {
    // transport makes sure reply has a valid length
    const status = reply.readUInt16BE(reply.length - 2);

    switch (status) {
      default:
        return;
    }
  }
}
