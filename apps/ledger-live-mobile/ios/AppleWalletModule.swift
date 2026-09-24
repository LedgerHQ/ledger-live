import PassKit
import React

@objc(AppleWalletModule)
final class AppleWalletModule: NSObject, RCTBridgeModule {
  static func moduleName() -> String! { "AppleWalletModule" }
  static func requiresMainQueueSetup() -> Bool { false }

  @objc(openPaymentSetup:rejecter:)
  func openPaymentSetup(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      guard PKPaymentAuthorizationController.canMakePayments() else {
        reject("apple_pay_unavailable", "Apple Pay is not available on this device", nil)
        return
      }

      PKPassLibrary().openPaymentSetup()
      resolve(nil)
    }
  }
}
