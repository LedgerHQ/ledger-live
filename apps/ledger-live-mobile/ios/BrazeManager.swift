//
//  BrazeManager.swift
//  ledgerlivemobile
//
//  Created by Lucas WEREY on 01/12/2025.
//  Copyright © 2025 Ledger SAS. All rights reserved.
//


import Foundation
import BrazeKit
import braze_react_native_sdk
import react_native_config

final class BrazeManager {
  static let shared = BrazeManager()
  private(set) var braze: Braze?

  private init() {
    // Singleton owns Braze lifecycle; no extra setup required here
  }

  func configure(pushAutoEnabled: Bool) {
    let apiKey = RNCConfig.env(for: "BRAZE_IOS_API_KEY") ?? ""
    let endpoint = RNCConfig.env(for: "BRAZE_CUSTOM_ENDPOINT") ?? ""

    let configuration = Braze.Configuration(apiKey: apiKey, endpoint: endpoint)
    configuration.triggerMinimumTimeInterval = 1
    configuration.logger.level = .info

    if pushAutoEnabled {
      configuration.push.automation = .init()
      configuration.push.automation.requestAuthorizationAtLaunch = false
    }

    let instance = Braze(configuration: configuration)
    self.braze = instance
  }

  func handleBackgroundNotification(
    userInfo: [AnyHashable: Any],
    completion: @escaping (UIBackgroundFetchResult) -> Void
  ) -> Bool {
    guard let braze = braze else { return false }
    return braze.notifications.handleBackgroundNotification(userInfo: userInfo, fetchCompletionHandler: completion)
  }

  func handleUserNotification(
    response: UNNotificationResponse,
    completion: @escaping () -> Void
  ) -> Bool {
    guard let braze = braze else { return false }
    return braze.notifications.handleUserNotification(response: response, withCompletionHandler: completion)
  }

  func register(deviceToken: Data) {
    braze?.notifications.register(deviceToken: deviceToken)
  }
}
