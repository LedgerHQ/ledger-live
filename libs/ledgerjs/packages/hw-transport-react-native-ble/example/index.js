/**
 * @format
 */

import {AppRegistry} from 'react-native';
import {registerTransportModule} from '@ledgerhq/live-common/lib/hw';
import {setDeviceMode} from '@ledgerhq/live-common/lib/hw/actions/app';
import BleTransport from '@ledgerhq/hw-transport-react-native-ble';
import App from './App';

setDeviceMode('polling');
registerTransportModule({
  id: 'ble',
  open: id => BleTransport.open(id),
  disconnect: id => BleTransport.disconnect(id),
});

AppRegistry.registerComponent('HwTransportReactNativeBleExample', () => App);
