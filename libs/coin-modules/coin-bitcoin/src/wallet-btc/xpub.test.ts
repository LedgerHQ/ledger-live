import Xpub from './xpub';
import { BigNumber } from "bignumber.js";
import { IStorage } from './storage/types';
import { IExplorer } from './explorer/types';
import { ICrypto } from './crypto/types';
import { DerivationModes } from './types';

jest.mock('./utils', () => ({
  ...jest.requireActual('./utils'),
  computeDustAmount: jest.fn().mockReturnValue(50),//new BigNumber(50)),
}));

// jest.mock('bignumber.js'); // Add this line to mock the 'bignumber.js' library

// Mocks
const mockStorage = {
  addAddress: jest.fn(),
  hasPendingTx: jest.fn(),
  removePendingTxs: jest.fn(),
  hasTx: jest.fn(),
  getHighestBlockHeightAndHash: jest.fn(),
  getAddressUnspentUtxos: jest.fn(),
  getUniquesAddresses: jest.fn(),
  getTx: jest.fn(),
  appendTxs: jest.fn(),
  removeTxs: jest.fn(),
  getLastConfirmedTxBlock: jest.fn()
} as unknown as jest.Mocked<IStorage>;

const mockExplorer = {
  getBlockByHeight: jest.fn(),
  getTxHex: jest.fn(),
  broadcast: jest.fn(),
  getTxsSinceBlockheight: jest.fn()
} as unknown as jest.Mocked<IExplorer>;

const mockCrypto = {
  getAddress: jest.fn(),
  toOutputScript: jest.fn(),
  toOpReturnOutputScript: jest.fn(),
  network: {
    name: 'testnet'
  }
} as unknown as jest.Mocked<ICrypto>;

describe('Xpub', () => {
  let xpubInstance: any;
  let storageMock: IStorage, explorerMock: IExplorer, cryptoMock: ICrypto;
  const DERIVATION_MODE = DerivationModes.TAPROOT;

  beforeEach(() => {
    storageMock = {
      addAddress: jest.fn(),
      hasPendingTx: jest.fn().mockReturnValue(false),
      removePendingTxs: jest.fn(),
      appendTxs: jest.fn(),
      hasTx: jest.fn().mockReturnValue(true),
      getUniquesAddresses: jest.fn(),
      getAddressUnspentUtxos: jest.fn().mockReturnValue([]),
      getTx: jest.fn(),
      getLastConfirmedTxBlock: jest.fn(),
      removeTxs: jest.fn(),
      getHighestBlockHeightAndHash: jest.fn(),
      getLastUnconfirmedTx: jest.fn(),
      export: jest.fn(),
      load: jest.fn(),
      exportSync: jest.fn(),
      loadSync: jest.fn(),
    };
    explorerMock = {
      baseUrl: 'mockBaseUrl',
      getFees: jest.fn(),
      getCurrentBlock: jest.fn(),
      getPendings: jest.fn(),
      getBlockByHeight: jest.fn(),
      getTxHex: jest.fn(),
      broadcast: jest.fn(),
      getTxsSinceBlockheight: jest.fn().mockReturnValue({ txs: [], nextPageToken: null }),
    };
    cryptoMock = {
      getAddress: jest.fn().mockResolvedValue('mockAddress'),
      toOutputScript: jest.fn(),
      toOpReturnOutputScript: jest.fn(),
      network: { name: 'mockNetwork' },
      customGetAddress: jest.fn(),
      validateAddress: jest.fn(),
      isTaprootAddress: jest.fn(),
    };

    xpubInstance = new Xpub({
      storage: storageMock,
      explorer: explorerMock,
      crypto: cryptoMock,
      xpub: 'mockXpub',
      derivationMode: DERIVATION_MODE,//'mockMode',
    });
  });

  describe('syncAddress', () => {
    it('should sync address correctly', async () => {
      const account = 0;
      const index = 0;
      const needReorg = false;

      const result = await xpubInstance.syncAddress(account, index, needReorg);

      expect(cryptoMock.getAddress).toHaveBeenCalledWith(DERIVATION_MODE, 'mockXpub', account, index);
      expect(storageMock.addAddress).toHaveBeenCalled();
      expect(storageMock.hasPendingTx).toHaveBeenCalledWith({ account, index });
      expect(storageMock.removePendingTxs).not.toHaveBeenCalled();
      expect(storageMock.appendTxs).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('buildTx', () => {
    it('should build transaction correctly', async () => {
      const params = {
        destAddress: 'destinationAddress',
        amount: new BigNumber(1000),
        feePerByte: 1,
        changeAddress: { address: 'changeAddress', account: 0, index: 0 },
        utxoPickingStrategy: {
          selectUnspentUtxosToUse: jest.fn().mockResolvedValue({
            totalValue: new BigNumber(2000),
            unspentUtxos: [
              { output_hash: 'hash1', value: new BigNumber(1500), address: 'address1', output_index: 0 },
            ],
            fee: new BigNumber(100),
            needChangeoutput: true,
          }),
        },
        sequence: 0,
        opReturnData: undefined,
      };

      cryptoMock.toOutputScript = jest.fn().mockReturnValue('outputScript');
      explorerMock.getTxHex = jest.fn().mockResolvedValue('txHex');
      storageMock.getTx = jest.fn().mockResolvedValue({ account: 0, index: 0 });

      const tx = await xpubInstance.buildTx({
        destAddress: 'destinationAddress',
        amount: new BigNumber(1000),
        feePerByte: 1,
        changeAddress: { address: 'changeAddress', account: 0, index: 0 },
        utxoPickingStrategy: {
          crypto: cryptoMock,
          derivationMode: DERIVATION_MODE,//'mockMode',
          excludedUTXOs: [],
          selectUnspentUtxosToUse: jest.fn().mockResolvedValue({
            totalValue: new BigNumber(2000),
            unspentUtxos: [
              { output_hash: 'hash2', value: new BigNumber(1500), address: 'address1', output_index: 0 },
            ],
            fee: new BigNumber(100),
            needChangeoutput: true,
          }),
        },
        sequence: 0,
        opReturnData: undefined,
      });

      expect(tx.inputs.length).toBe(1);
      console.log({tx})
      console.log({txinputs: tx.inputs})
      console.log({txoutputs: tx.outputs})
      expect(tx.outputs.length).toBe(2); // one for destAddress and one for change
      expect(tx.fee).toBe(100);
    });
  });
});
