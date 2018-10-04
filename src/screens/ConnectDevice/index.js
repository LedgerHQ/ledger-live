// @flow
import React, { Component, Fragment } from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import Icon from "react-native-vector-icons/dist/FontAwesome";
import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/live-common/lib/types";

import { accountScreenSelector } from "../../reducers/accounts";

import HeaderRightClose from "../../components/HeaderRightClose";
import StepHeader from "../../components/StepHeader";
import Stepper from "../../components/Stepper";
import LText from "../../components/LText";
import CurrencyIcon from "../../components/CurrencyIcon";
import Button from "../../components/Button";

import colors from "../../colors";

import Step from "./Step";

type Props = {
  account: Account,
  navigation: NavigationScreenProp<{
    params: {
      accountId: string,
    },
  }>,
};

type State = {
  deviceConnected: boolean,
  appOpened: boolean,
};

class ConnectDevice extends Component<Props, State> {
  static navigationOptions = ({ screenProps }: *) => ({
    headerTitle: <StepHeader title="Device" subtitle="step 2 of 4" />,
    headerRight: (
      <HeaderRightClose navigation={screenProps.topLevelNavigation} />
    ),
  });

  state = {
    deviceConnected: false,
    appOpened: false,
  };

  timeout: *;

  componentDidMount() {
    this.resolveSteps();
  }

  componentWillUnmount() {
    clearTimeout(this.timeout);
  }

  navigate = () => {
    const { navigation, account } = this.props;
    navigation.navigate("VerifyAddress", {
      accountId: account.id,
    });
  };

  renderStepOneIcon = () => {
    const { deviceConnected } = this.state;
    return (
      <View
        style={[
          styles.iconContainer,
          deviceConnected ? styles.iconContainerResolved : undefined,
        ]}
      >
        <Icon
          name="bluetooth-b"
          size={18}
          color={deviceConnected ? colors.darkBlue : colors.grey}
        />
      </View>
    );
  };

  renderStepOneText = () => {
    const { deviceConnected } = this.state;
    return (
      <Fragment>
        <LText
          style={[
            styles.stepText,
            deviceConnected ? styles.stepTextResolved : undefined,
          ]}
        >
          Connect and unlock your
        </LText>
        <LText
          style={[
            styles.stepText,
            deviceConnected ? styles.stepTextResolved : undefined,
          ]}
          semiBold
        >
          Ledger Device
        </LText>
      </Fragment>
    );
  };

  renderStepTwoIcon = () => {
    const { appOpened } = this.state;
    const { account } = this.props;
    return (
      <View
        style={[
          styles.iconContainer,
          appOpened ? styles.iconContainerResolved : undefined,
        ]}
      >
        <CurrencyIcon
          size={18}
          currency={account.currency}
          color={!appOpened ? colors.grey : undefined}
        />
      </View>
    );
  };

  renderStepTwoText = () => {
    const { appOpened } = this.state;
    const { account } = this.props;
    return (
      <Fragment>
        <LText
          style={[
            styles.stepText,
            appOpened ? styles.stepTextResolved : undefined,
          ]}
        >
          Open the &nbsp;
          <LText
            style={[
              styles.stepText,
              appOpened ? styles.stepTextResolved : undefined,
            ]}
            semiBold
          >
            {account.currency.managerAppName} App &nbsp;
          </LText>
          on your device
        </LText>
      </Fragment>
    );
  };

  // FIXME: Temporary method to display how things will work
  resolveSteps = () => {
    this.timeout = setTimeout(() => {
      this.setState({ deviceConnected: true });
      this.timeout = setTimeout(() => {
        this.setState({ appOpened: true });
      }, 2000);
    }, 2000);
  };

  render(): React$Node {
    const { deviceConnected, appOpened } = this.state;
    const enabled = deviceConnected && appOpened;
    return (
      <SafeAreaView style={styles.root}>
        <Stepper nbSteps={4} currentStep={2} />
        <View style={styles.container}>
          <LText semiBold style={styles.title}>
            Follow the steps below
          </LText>
          <Step
            icon={this.renderStepOneIcon()}
            text={this.renderStepOneText()}
            resolved={deviceConnected}
            style={styles.step}
          />
          <Step
            icon={this.renderStepTwoIcon()}
            text={this.renderStepTwoText()}
            resolved={appOpened}
            style={styles.step}
          />
        </View>
        <View style={styles.bottomContainer}>
          <LText semiBold style={styles.noDeviceText}>
            {"Don't have your device ?"}
          </LText>
          <Button
            type="primary"
            title="Continue"
            onPress={this.navigate}
            disabled={!enabled}
          />
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 24,
    flex: 1,
  },
  title: {
    fontSize: 16,
    textAlign: "center",
    color: colors.darkBlue,
    marginBottom: 24,
  },
  noDeviceText: {
    fontSize: 14,
    color: colors.grey,
    textAlign: "center",
    marginBottom: 16,
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.grey,
    borderRadius: 10,
    width: 32,
    height: 32,
  },
  iconContainerResolved: {
    borderColor: colors.darkBlue,
  },
  bottomContainer: {
    padding: 16,
  },
  stepText: {
    fontSize: 14,
    color: colors.grey,
    textAlign: "center",
  },
  stepTextResolved: {
    color: colors.darkBlue,
  },
  step: {
    marginBottom: 16,
  },
});

const mapStateToProps = createStructuredSelector({
  account: accountScreenSelector,
});

export default connect(mapStateToProps)(ConnectDevice);
