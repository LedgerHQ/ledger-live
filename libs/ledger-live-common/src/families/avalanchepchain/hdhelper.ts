import { avalancheClient } from "./api/client";
import { binTools } from "./utils";
import HDKey from "hdkey";
import { AVAX_HRP } from "./utils";
import {
  AmountOutput,
  PlatformVMConstants,
  StakeableLockOut,
  UTXOSet,
} from "avalanche/dist/apis/platformvm";
import BigNumber from "bignumber.js";
import { BN } from "avalanche";
import { UnixNow } from "avalanche/dist/utils";
import { getAddressChains } from "./api";
import { createHash } from "crypto";

const INDEX_RANGE = 20;
const SCAN_SIZE = 100;
const SCAN_RANGE = SCAN_SIZE - INDEX_RANGE;

//Liberally inspired by the HdHelper from https://github.com/ava-labs/avalanche-wallet
class HDHelper {
  private static instance: HDHelper;

  hdKey: HDKey;
  chainId: string;
  addressCache: {
    [index: number]: string;
  };
  hdCache: {
    [index: number]: HDKey;
  };
  changePath: string;
  hdIndex: number;
  utxoSet: UTXOSet;

  private constructor(publicKey: string, chainCode: string) {
    const publicKeyBuffer = Buffer.from(publicKey, "hex");
    const chainCodeBuffer = Buffer.from(chainCode, "hex");

    this.hdKey = new HDKey();
    this.hdKey.publicKey = publicKeyBuffer;
    this.hdKey.chainCode = chainCodeBuffer;

    this.chainId = "P";
    this.addressCache = {};
    this.hdCache = {};
    this.changePath = "m/0";
    this.hdIndex = 0;
    this.utxoSet = new UTXOSet();
  }

  static async instantiate(
    publicKey: string,
    chainCode: string
  ): Promise<HDHelper> {
    this.instance = new this(publicKey, chainCode);
    this.instance.hdIndex = await this.instance.findAvailableIndexExplorer();
    return this.instance;
  }

  async fetchUTXOs(): Promise<UTXOSet> {
    const addresses: string[] = this.getAllDerivedAddresses();

    this.utxoSet = await this.getAllUXTOs(addresses);

    return this.utxoSet;
  }

  async fetchStake(): Promise<BigNumber> {
    const addresses: string[] = this.getAllDerivedAddresses();

    return this.getStakeForAddresses(addresses);
  }

  async fetchBalances() {
    return await this.getPChainBalances();
  }

  getCurrentAddress(): string {
    const index = this.hdIndex;
    return this.getAddressForIndex(index);
  }

  getFirstAvailableIndex(): number {
    for (let i = 0; i < this.hdIndex; i++) {
      const addr = this.getAddressForIndex(i);
      const addrBuf = binTools.parseAddress(addr, this.chainId);
      const utxoIds = this.utxoSet.getUTXOIDs([addrBuf]);
      if (utxoIds.length === 0) {
        return i;
      }
    }

    return 0;
  }

  getFirstAvailableAddress(): string {
    const index = this.getFirstAvailableIndex();
    return this.getAddressForIndex(index);
  }

  async findAvailableIndexExplorer(start = 0): Promise<number> {
    const upTo = 64;
    const addresses: string[] = this.getAllDerivedAddresses(
      start + upTo,
      start
    );
    const addressChains = await getAddressChains(addresses);

    const chainID = avalancheClient().PChain().getBlockchainID();

    for (let i = 0; i < addresses.length - INDEX_RANGE; i++) {
      let gapSize = 0;

      for (let n = 0; n < INDEX_RANGE; n++) {
        const scanIndex = i + n;
        const scanAddr = addresses[scanIndex];

        const rawAddr = scanAddr.split("-")[1];
        const chains: string[] = addressChains[rawAddr];
        if (!chains) {
          // If doesnt exist on any chain
          gapSize++;
        } else if (!chains.includes(chainID)) {
          // If doesnt exist on this chain
          gapSize++;
        } else {
          i = i + n;
          break;
        }
      }

      // If the gap is reached return the index
      if (gapSize === INDEX_RANGE) {
        return start + i;
      }
    }

    return await this.findAvailableIndexExplorer(start + SCAN_RANGE);
  }

  getAllDerivedAddresses(upTo = this.hdIndex, start = 0): string[] {
    const result: string[] = [];

    for (let i = start; i <= upTo; i++) {
      const addr = this.getAddressForIndex(i);
      result.push(addr);
    }

    return result;
  }

  getExtendedAddresses() {
    const hdIndex = this.hdIndex;
    return this.getAllDerivedAddresses(hdIndex + INDEX_RANGE);
  }

  getAddressForIndex(index: number): string {
    if (this.addressCache[index]) {
      return this.addressCache[index];
    }

    const derivationPath = `${this.changePath}/${index.toString()}`;

    let key: HDKey;
    if (this.hdCache[index]) {
      key = this.hdCache[index];
    } else {
      key = this.hdKey.derive(derivationPath) as HDKey;
      this.hdCache[index] = key;
    }

    const chainId = this.chainId;

    const sha256 = Buffer.from(
      createHash("sha256").update(key.publicKey).digest()
    );
    const ripesha = Buffer.from(
      createHash("ripemd160").update(sha256).digest()
    );

    const addr = binTools.addressToString(AVAX_HRP, chainId, ripesha as any);

    this.addressCache[index] = addr;
    return addr;
  }

  async getAllUXTOs(addresses: string[]): Promise<UTXOSet> {
    if (addresses.length <= 1024) {
      const newSet = await this.getAllUXTOsForAddresses(addresses);
      return newSet;
    } else {
      //Break the list into 1024 chunks
      const chunk = addresses.slice(0, 1024);
      const remainingChunk = addresses.slice(1024);

      const newSet = await this.getAllUXTOsForAddresses(chunk);

      return newSet.merge(await this.getAllUXTOs(remainingChunk));
    }
  }

  async getAllUXTOsForAddresses(
    addresses: string[],
    endIndex: any = undefined
  ): Promise<UTXOSet> {
    const pChain = avalancheClient().PChain();
    let response;

    if (!endIndex) {
      response = await pChain.getUTXOs(addresses);
    } else {
      response = await pChain.getUTXOs(addresses, undefined, 0, endIndex);
    }

    const utxoSet = response.utxos;
    const nextEndIndex = response.endIndex;
    const len = response.numFetched;

    if (len >= 1024) {
      const subUtxos = await this.getAllUXTOsForAddresses(
        addresses,
        nextEndIndex
      );
      return utxoSet.merge(subUtxos);
    }

    return utxoSet;
  }

  async getStakeForAddresses(addresses: string[]): Promise<BigNumber> {
    const pChain = avalancheClient().PChain();

    if (addresses.length <= 256) {
      const stakeData = await pChain.getStake(addresses);
      return new BigNumber(stakeData.staked.toString());
    } else {
      //Break the list in to 1024 chunks
      const chunk = addresses.slice(0, 256);
      const remainingChunk = addresses.slice(256);

      const stakeData = await pChain.getStake(chunk);
      const chunkStake = stakeData.staked;
      return chunkStake.add(await this.getStakeForAddresses(remainingChunk));
    }
  }

  async getPChainBalances() {
    const balances = {
      available: new BN(0),
      locked: new BN(0),
      lockedStakeable: new BN(0),
      multisig: new BN(0),
    };

    const utxoSet: UTXOSet = await this.fetchUTXOs();
    const now = UnixNow();

    const utxos = utxoSet.getAllUTXOs();

    for (let n = 0; n < utxos.length; n++) {
      const utxo = utxos[n];
      const utxoOut = utxo.getOutput();
      const outId = utxoOut.getOutputID();
      const threshold = utxoOut.getThreshold();

      if (threshold > 1) {
        balances.multisig.iadd((utxoOut as AmountOutput).getAmount());
        continue;
      }

      const isStakeableLock = outId === PlatformVMConstants.STAKEABLELOCKOUTID;

      let locktime;
      if (isStakeableLock) {
        locktime = (utxoOut as StakeableLockOut).getStakeableLocktime();
      } else {
        locktime = (utxoOut as AmountOutput).getLocktime();
      }

      if (locktime.lte(now)) {
        balances.available.iadd((utxoOut as AmountOutput).getAmount());
      } else if (!isStakeableLock) {
        balances.locked.iadd((utxoOut as AmountOutput).getAmount());
      } else if (isStakeableLock) {
        balances.lockedStakeable.iadd((utxoOut as AmountOutput).getAmount());
      }
    }

    return {
      available: new BigNumber(balances.available.toString()),
      locked: new BigNumber(balances.locked.toString()),
      lockedStakeable: new BigNumber(balances.lockedStakeable.toString()),
      multisig: new BigNumber(balances.multisig.toString()),
    };
  }
}

export { HDHelper };
