// @flow

import React, { PureComponent } from "react";
import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableWithoutFeedback,
} from "react-native";
import { Subject, merge, Observable } from "rxjs";
import Config from "react-native-config";

export const rejections = new Subject();

const defaultErrorCreator = () => new Error("DebugRejectSwitch");

// usage: observable.pipe(rejectionOp())
export const rejectionOp = <T>(
  createError: () => Error = defaultErrorCreator,
) => (observable: Observable<T>): Observable<T> =>
  !Config.DEBUG_REJECT_SWITCH
    ? observable
    : Observable.create(o => {
        merge(
          observable,
          Observable.create(o => {
            rejections.subscribe(() => {
              o.error(createError());
            });
          }),
        ).subscribe(o);
      });

// usage: hookRejections(promise)
export const hookRejections = <T>(
  p: Promise<T>,
  createError: () => Error = defaultErrorCreator,
): Promise<T> =>
  !Config.DEBUG_REJECT_SWITCH
    ? p
    : Promise.race([
        p,
        new Promise((_, rej) => {
          const sub = rejections.subscribe(() => {
            sub.unsubscribe();
            rej(createError());
          });
        }),
      ]);

export default class DebugRejectSwitch extends PureComponent<{}> {
  onPress = () => {
    rejections.next();
  };

  render() {
    if (!Config.DEBUG_REJECT_SWITCH) return null;
    return (
      <SafeAreaView>
        <TouchableWithoutFeedback onPress={this.onPress}>
          <View style={styles.root} />
        </TouchableWithoutFeedback>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    right: 0,
    bottom: 50,
    height: 40,
    width: 25,
    borderWidth: 1,
    borderColor: "rgba(200,0,0,0.1)",
    zIndex: 999,
  },
});
