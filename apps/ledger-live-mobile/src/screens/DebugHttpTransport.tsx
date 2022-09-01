import React, { Component } from "react";
import {
  StyleSheet,
  View,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { connect } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import { compose } from "redux";
import { CompositeScreenProps } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "../const";
import { addKnownDevice } from "../actions/ble";
import { getFontStyle } from "../components/LText";
import TextInput from "../components/TextInput";
import KeyboardView from "../components/KeyboardView";
import Button from "../components/Button";
import { Theme, withTheme } from "../colors";
import { SettingsNavigatorStackParamList } from "../components/RootNavigator/types/SettingsNavigator";
import { StackNavigatorProps } from "../components/RootNavigator/types/helpers";
import { MainNavigatorParamList } from "../components/RootNavigator/types/MainNavigator";

type NavigatorProps = CompositeScreenProps<
  StackNavigatorProps<
    SettingsNavigatorStackParamList,
    ScreenName.DebugHttpTransport
  >,
  StackNavigatorProps<MainNavigatorParamList>
>;

type Props = {
  addKnownDevice: (_: { id: string; name: string }) => void;
  colors: Theme["colors"];
} & NavigatorProps;

class DebugHttpTransport extends Component<
  Props,
  {
    text: string;
  }
> {
  state = {
    text: "",
  };
  onChangeText = (text: string) => {
    this.setState({
      text,
    });
  };
  onAdd = () => {
    const m = this.state.text
      .trim()
      .match(/^((?:[0-9]{1,3}\.){3}[0-9]{1,3})(:([0-9]+))?/);
    if (!m) return;
    let [, ip, , port] = m; // eslint-disable-line prefer-const

    if (!port) port = "8435";
    this.props.addKnownDevice({
      id: `httpdebug|ws://${ip}:${port}`,
      name: ip,
    });
    this.props.navigation.navigate(NavigatorName.Manager, {
      screen: ScreenName.Manager,
    });
  };

  render() {
    const { text } = this.state;
    const { colors } = this.props;
    return (
      <SafeAreaView
        style={[
          styles.root,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        <KeyboardView style={styles.container}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View
              style={{
                flex: 1,
              }}
            >
              <TextInput
                value={text}
                onChangeText={this.onChangeText}
                autoFocus
                autoCorrect
                selectTextOnFocus
                clearButtonMode="always"
                placeholder="192.168.0.1"
                returnKeyType="done"
                style={[
                  getFontStyle({
                    semiBold: true,
                  }),
                  styles.input,
                ]}
              />
              <View style={styles.buttonContainer}>
                <Button
                  event="DebugHttpTransportAdd"
                  type="primary"
                  title="Add"
                  containerStyle={styles.continueButton}
                  onPress={this.onAdd}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardView>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    padding: 16,
    justifyContent: "flex-end",
  },
  continueButton: {
    alignSelf: "stretch",
  },
  container: {
    flex: 1,
  },
  input: {
    fontSize: 22,
  },
});

export default compose<React.ComponentType<NavigatorProps>>(
  connect(null, {
    addKnownDevice,
  }),
  withTheme,
)(DebugHttpTransport);
