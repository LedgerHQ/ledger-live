//
//  ReduceTransparencyModule.swift
//  ledgerlivemobile
//
//  Copyright © 2025 Ledger SAS. All rights reserved.
//

import React
import UIKit

@objc(ReduceTransparencyModule)
final class ReduceTransparencyModule: NSObject, RCTBridgeModule {
  static func moduleName() -> String! { "ReduceTransparencyModule" }
  static func requiresMainQueueSetup() -> Bool { false }

  @objc func getReduceTransparencyEnabled(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      let enabled = UIAccessibility.isReduceTransparencyEnabled
      resolve(enabled)
    }
  }
}
