import Foundation
import React

@objc(BiometricsOverlayManager)
class BiometricsOverlayManager: NSObject, RCTBridgeModule {
  private static var biometricInProgress: Bool = false

  @objc static func requiresMainQueueSetup() -> Bool {
    false
  }

  @objc(setBiometricInProgress:)
  func setBiometricInProgress(_ inProgress: Bool) {
    BiometricsOverlayManager.biometricInProgress = inProgress
    UserDefaults.standard.set(inProgress, forKey: "BiometricInProgressOverlay")
  }

  @objc(isBiometricInProgress:rejecter:)
  func isBiometricInProgress(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    let persisted = UserDefaults.standard.bool(forKey: "BiometricInProgressOverlay")
    resolve(BiometricsOverlayManager.biometricInProgress || persisted)
  }

  @objc static func isBiometricInProgressFlag() -> Bool {
    biometricInProgress
  }
}


