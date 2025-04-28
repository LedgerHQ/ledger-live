export default class WalletAPIReceive {
  continueWithoutDevice() {
    return tapByText("Continue without my device");
  }

  confirmNoDevice() {
    return tapByText("Confirm");
  }

  cancelNoDevice() {
    return tapByText("Cancel");
  }
}
