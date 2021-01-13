// @flow

import React, { PureComponent } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { Subject, Observable, throwError } from "rxjs";
import Config from "react-native-config";
import { flatMap } from "rxjs/operators";
import LText from "./LText";

export const rejections: Subject<void> = new Subject();
const forceInset = { bottom: "always" };
const defaultErrorCreator = () => new Error("DebugRejectSwitch");

// usage: observable.pipe(rejectionOp())
export const rejectionOp = (createError: () => Error = defaultErrorCreator) => <
  T,
>(
  observable: Observable<T>,
): Observable<T> =>
  !Config.MOCK
    ? observable
    : Observable.create(o => {
        const s = observable.subscribe(o);
        const s2 = rejections
          .pipe(flatMap(() => throwError(createError())))
          .subscribe(o);
        return () => {
          s.unsubscribe();
          s2.unsubscribe();
        };
      });

// usage: hookRejections(promise)
export const hookRejections = <T>(
  p: Promise<T>,
  createError: () => Error = defaultErrorCreator,
): Promise<T> =>
  !Config.MOCK
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
    if (!Config.MOCK) return null;
    return (
      <SafeAreaView forceInset={forceInset}>
        <TouchableOpacity onPress={this.onPress}>
          <View style={styles.root}>
            <LText bold style={styles.text} color="white">
              {[..."STOP"].join("\n")}
            </LText>
          </View>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    left: 0,
    bottom: 80,
    width: 30,
    backgroundColor: "red",
    zIndex: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    textAlign: "center",
    paddingVertical: 10,
  },
});
