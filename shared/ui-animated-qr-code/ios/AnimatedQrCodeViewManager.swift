import React
import UIKit

@objc(SharedAnimatedQrCodeViewManager)
final class AnimatedQrCodeViewManager: RCTViewManager {
  override static func requiresMainQueueSetup() -> Bool { true }

  override func view() -> UIView! {
    AnimatedQrCodeView()
  }
}
