//
//  ZcashFfiModule.swift
//  ZcashFfiMobile
//
//  Copyright © 2026 Ledger SAS. All rights reserved.
//

import Foundation
import React
import ZcashFfiMobile

/// Bridges the Zcash engine's C ABI to JavaScript.
///
/// This file is compiled only as part of the `ZcashFfiMobile` pod, which the
/// Podfile adds only when the prebuilt XCFramework is present -- so an app
/// built without the Rust artifacts simply has no `ZcashFfiModule`, and the JS
/// layer reports the engine as unavailable.
@objc(ZcashFfiModule)
final class ZcashFfiModule: NSObject, RCTBridgeModule {
  static func moduleName() -> String! { "ZcashFfiModule" }

  // Nothing here touches UIKit, and eager setup would put the engine on the
  // startup path for a feature most sessions never use.
  static func requiresMainQueueSetup() -> Bool { false }

  // Derivation is a few milliseconds of pure CPU work, but it is still work:
  // keep it off the main queue. Stored, not computed -- a computed property
  // would hand out a fresh queue on every access.
  private let queue = DispatchQueue(label: "com.ledger.live.zcash-ffi", qos: .userInitiated)

  @objc var methodQueue: DispatchQueue { queue }

  /// Maps a C-ABI status to the rejection code the JS layer switches on.
  ///
  /// Mirrors the `ZCASH_*` constants in `zcash_ffi_mobile.h`, which is the
  /// source of truth. Spelled out rather than read from the imported macros so
  /// that a status the header adds later surfaces as `ZCASH_FFI_UNKNOWN`
  /// instead of a silently wrong label.
  private func errorCode(for status: Int32) -> String {
    switch status {
    case -1: return "ZCASH_FFI_NULL_ARG"
    case -2: return "ZCASH_FFI_INVALID_UTF8"
    case -3: return "ZCASH_FFI_CRYPTO"
    case -4: return "ZCASH_FFI_PANIC"
    case -5: return "ZCASH_FFI_INTERIOR_NUL"
    default: return "ZCASH_FFI_UNKNOWN"
    }
  }

  /// Derives the Orchard-only unified address the device displays.
  ///
  /// Never log `ufvk` or a failure detail: a viewing key exposes the account's
  /// entire history. The Rust layer keeps key material out of its error
  /// strings; this side must not put it back.
  @objc func deriveOrchardAddress(
    _ ufvk: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    var out: UnsafeMutablePointer<CChar>?
    let status = zcash_orchard_address_from_ufvk(ufvk, &out)

    // The C contract: on every status except ZCASH_ERR_NULL_ARG the caller owns
    // `*out` and must release it. This covers both the success value and the
    // error message.
    defer {
      if let out = out { zcash_string_free(out) }
    }

    guard let out = out else {
      // ZCASH_ERR_NULL_ARG only, which a non-null Swift String cannot cause.
      reject(errorCode(for: status), "Zcash FFI rejected a null argument", nil)
      return
    }

    let value = String(cString: out)

    if status == 0 {
      resolve(value)
    } else {
      // On a failure `*out` carries the message, not an address.
      reject(errorCode(for: status), value, nil)
    }
  }

  /// Diagnostic probe: does Rayon give real parallelism on this device?
  ///
  /// Not part of the wallet surface. It exists because nothing shipped has ever
  /// spawned a thread from Rust here — the artifact imports no `pthread_create`
  /// at all — and mobile shielded sync depends on the answer.
  ///
  /// Whoever reads the numbers: on the Simulator this measures the **Mac's**
  /// cores, not a phone's.
  @objc func threadProbe(
    _ ufvk: String,
    iterations: NSNumber,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    var out: UnsafeMutablePointer<CChar>?
    let status = zcash_ffi_thread_probe(ufvk, iterations.uint32Value, &out)

    defer {
      if let out = out { zcash_string_free(out) }
    }

    guard let out = out else {
      reject(errorCode(for: status), "Zcash FFI rejected a null argument", nil)
      return
    }

    let value = String(cString: out)

    if status == 0 {
      resolve(value)
    } else {
      reject(errorCode(for: status), value, nil)
    }
  }
}
