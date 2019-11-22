/* @flow */
import React, { Component } from "react";
import type { NavigationScreenProp } from "react-navigation";

import Touchable from "./Touchable";
import CloseIcon from "../icons/Close";
import colors from "../colors";
import ConfirmationModal from "./ConfirmationModal";

type Props = {
  preferDismiss: boolean,
  navigation: NavigationScreenProp<*>,
  color: string,
  withConfirmation?: boolean,
  confirmationTitle?: React$Node,
  confirmationDesc?: React$Node,
};

type State = {
  isConfirmationModalOpened: boolean,
  onModalHide: () => void,
};

class HeaderRightClose extends Component<Props, State> {
  static defaultProps = {
    color: colors.grey,
    preferDismiss: true,
  };

  state = {
    isConfirmationModalOpened: false,
    onModalHide: () => {},
  };

  close = () => {
    const { navigation, preferDismiss } = this.props;
    if (navigation.dismiss && preferDismiss) {
      const dismissed = navigation.dismiss();
      if (!dismissed) navigation.goBack();
    }
    // $FlowFixMe
    if (navigation.closeDrawer) navigation.closeDrawer();

    navigation.goBack();
  };

  onPress = () => {
    const { withConfirmation } = this.props;
    if (withConfirmation) {
      this.openConfirmationModal();
    } else {
      this.close();
    }
  };

  openConfirmationModal = () =>
    this.setState({ isConfirmationModalOpened: true });

  closeConfirmationModal = () =>
    this.setState({ isConfirmationModalOpened: false });

  onConfirm = () =>
    this.setState({
      onModalHide: this.close,
      isConfirmationModalOpened: false,
    });

  render() {
    const {
      withConfirmation,
      confirmationTitle,
      confirmationDesc,
    } = this.props;
    const { isConfirmationModalOpened, onModalHide } = this.state;
    return (
      <Touchable
        event="HeaderRightClose"
        onPress={this.onPress}
        style={{ marginHorizontal: 16 }}
      >
        <CloseIcon size={18} color={this.props.color} />
        {withConfirmation && (
          <ConfirmationModal
            isOpened={isConfirmationModalOpened}
            onClose={this.closeConfirmationModal}
            onConfirm={this.onConfirm}
            confirmationTitle={confirmationTitle}
            confirmationDesc={confirmationDesc}
            onModalHide={onModalHide}
          />
        )}
      </Touchable>
    );
  }
}

export default HeaderRightClose;
