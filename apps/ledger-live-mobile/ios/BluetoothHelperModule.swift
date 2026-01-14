//
//  BluetoothHelperModule.swift
//  ledgerlivemobile
//
//  Created by Lucas WEREY on 01/12/2025.
//  Copyright © 2025 Ledger SAS. All rights reserved.
//

import CoreBluetooth
import React

@objc(BluetoothHelperModule)
final class BluetoothHelperModule: NSObject, RCTBridgeModule, CBCentralManagerDelegate {
  private var centralManager: CBCentralManager?
  private var pendingResolve: RCTPromiseResolveBlock?
  private var pendingReject: RCTPromiseRejectBlock?

  static func moduleName() -> String! { "BluetoothHelperModule" }
  static func requiresMainQueueSetup() -> Bool { true }

  @objc(prompt:rejecter:)
  func prompt(_ resolve: @escaping RCTPromiseResolveBlock,
              rejecter reject: @escaping RCTPromiseRejectBlock) {
    pendingResolve = resolve
    pendingReject = reject

    centralManager = CBCentralManager(delegate: self, queue: nil)
  }

  // MARK: - CBCentralManagerDelegate

  func centralManagerDidUpdateState(_ central: CBCentralManager) {
    defer {
      centralManager = nil
      pendingResolve = nil
      pendingReject = nil
    }

    guard let resolve = pendingResolve else { return }

    resolve(nil)

    // Keeping the following lines commented for reference, if we ever want to be more accurate.
    /*
    switch central.state {
    case .poweredOn:
      resolve(NSNumber(value: 1))
    case .poweredOff:
      resolve(NSNumber(value: 0))
    case .unauthorized:
      pendingReject?("bluetooth_unauthorized", "Bluetooth use not authorized", nil)
    default:
      pendingReject?("bluetooth_unknown", "Unknown Bluetooth state", nil)
    }
    */
  }
}
