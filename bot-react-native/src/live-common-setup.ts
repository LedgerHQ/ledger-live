import Config from 'react-native-config';
import {setEnvUnsafe} from '@ledgerhq/live-common/lib/env';
import {setSupportedCurrencies} from '@ledgerhq/live-common/lib/currencies';
import {setDeviceMode} from '@ledgerhq/live-common/lib/hw/actions/app';
import {setPlatformVersion} from '@ledgerhq/live-common/lib/platform/version';

setDeviceMode('polling');

setPlatformVersion('0.0.1');

setSupportedCurrencies([
  'bitcoin',
  'ethereum',
  'bsc',
  'polkadot',
  'solana',
  'ripple',
  'litecoin',
  'polygon',
  'bitcoin_cash',
  'stellar',
  'dogecoin',
  'cosmos',
  'crypto_org',
  'dash',
  'tron',
  'tezos',
  'ethereum_classic',
  'zcash',
  'decred',
  'digibyte',
  'algorand',
  'qtum',
  'bitcoin_gold',
  'komodo',
  'pivx',
  'zencash',
  'vertcoin',
  'peercoin',
  'viacoin',
  'stakenet',
  'bitcoin_testnet',
  'ethereum_ropsten',
  'cosmos_testnet',
  'elrond',
]);

for (const k in Config) {
  setEnvUnsafe(k as any, Config[k]);
}
