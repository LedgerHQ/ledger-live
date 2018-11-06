// @flow

import React, { PureComponent, Fragment } from "react";
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  ScrollView,
} from "react-native";

import OnboardingHeader from "./OnboardingHeader";

type Container = { children: *, style?: * };

type Props = Container & {
  isCentered?: boolean,
  isFull?: boolean,
  header?: string,
  Footer?: React$ComponentType<*>,
};

export default class OnboardingLayout extends PureComponent<Props> {
  render() {
    const { children, header, Footer, isCentered, isFull, style } = this.props;

    let inner: React$Node = children;

    if (isCentered) {
      inner = <View>{inner}</View>;
    }

    if (isFull) {
      inner = <OnboardingInner>{inner}</OnboardingInner>;
    }

    if (header) {
      inner = (
        <Fragment>
          <OnboardingHeader stepId={header} />
          <OnboardingInner>{inner}</OnboardingInner>
          {Footer && (
            <View style={styles.footer}>
              <Footer />
            </View>
          )}
        </Fragment>
      );
    }

    return (
      <SafeAreaView style={[styles.root, isCentered && styles.centered, style]}>
        {inner}
      </SafeAreaView>
    );
  }
}

export class OnboardingInner extends PureComponent<Container> {
  render() {
    return <ScrollView style={styles.inner}>{this.props.children}</ScrollView>;
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingTop: StatusBar.currentHeight,
    backgroundColor: "white",
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
  inner: {
    padding: 16,
    flexGrow: 1,
  },
  footer: {
    padding: 16,
  },
});
