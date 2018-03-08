// @flow
import { Observable } from "rxjs/Observable";
import { PromiseObservable } from "rxjs/observable/PromiseObservable";
import "rxjs/add/observable/merge";
import "rxjs/add/observable/empty";
import "rxjs/add/operator/first";
import "rxjs/add/operator/map";
import "rxjs/add/operator/catch";
import "rxjs/add/operator/concatMap";
import HIDTransport from "@ledgerhq/react-native-hid";
import BluetoothTransport from "@ledgerhq/react-native-hw-transport-ble";
import { withStaticURL } from "@ledgerhq/hw-transport-http";
import Config from "react-native-config";

const transports: Array<*> = [HIDTransport, BluetoothTransport];
if (__DEV__) {
  transports.push(withStaticURL(Config.DEBUG_COMM_HTTP_PROXY));
}

export default () =>
  Observable.merge(
    ...transports.map(t =>
      Observable.create(t.listen)
        .map(({ descriptor }) => ({ descriptor, t }))
        .catch(e => {
          console.warn(`discover failed for ${t.name}: ${e}`);
          return Observable.empty();
        })
    )
  )
    .first()
    .concatMap(({ descriptor, t }) =>
      PromiseObservable.create(t.open(descriptor))
    );
