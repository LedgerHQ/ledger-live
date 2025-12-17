import UIKit
import UserNotifications
import ObjectiveC.runtime

import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

import FirebaseCore
import FirebaseMessaging

import BrazeKit
import BrazeUI
import braze_react_native_sdk

import react_native_splash_screen

import Expo
import ExpoModulesCore


class AppDelegate: RCTAppDelegate, UNUserNotificationCenterDelegate {

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    self.moduleName = "ledgerlivemobile"
    self.dependencyProvider = RCTAppDependencyProvider()

    FirebaseConfigurator.configure()

    var pushAutoEnabled = true
    if UserDefaults.standard
      .object(
        forKey: AppKeys.UserDefaults.iOSPushAutoEnabled
      ) != nil {
      pushAutoEnabled = UserDefaults.standard
        .bool(
          forKey: AppKeys.UserDefaults.iOSPushAutoEnabled
        )
    }
    if pushAutoEnabled {
      print(
        "iOS Push Auto enabled."
      )
    }

    BrazeManager.shared.configure(
      pushAutoEnabled: pushAutoEnabled
    )

    if !pushAutoEnabled {
      print(
        "iOS Push Auto disabled - Registering for push manually."
      )
      registerForPushNotifications()
    }

    BrazeReactUtils
      .sharedInstance()
      .populateInitialPayload(
        fromLaunchOptions: launchOptions
      )

    let appLaunched = super.application(application, didFinishLaunchingWithOptions: launchOptions)

    if !appLaunched {
        return false
    }

    let isRunningDetox = ProcessInfo.processInfo.arguments.contains(
      "-IS_TEST"
    )
    if isRunningDetox {
      return true
    }

    RNSplashScreen
      .show()

    UserDefaults.standard.set(
      false,
      forKey: AppKeys.UserDefaults.biometricInProgressOverlay
    )

    return true
  }

  // MARK: - RCTBridgeDelegate
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    return self.bundleURL()
  }

  override func bundleURL() -> URL? {
    #if DEBUG
      return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
    #else
      return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    #endif
  }

  // MARK: - Push registration

  func registerForPushNotifications() {
    let center = UNUserNotificationCenter.current()
    center
      .setNotificationCategories(
        Braze.Notifications.categories
      )
    center.delegate = self
    UIApplication.shared
      .registerForRemoteNotifications()
  }

  // MARK: - Remote notifications


  @objc(application:didRegisterForRemoteNotificationsWithDeviceToken:)
  override dynamic func application(
    _ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
  ) {
    Messaging.messaging().apnsToken = deviceToken

    BrazeManager.shared.register(deviceToken: deviceToken)
  }

  // MARK: - UNUserNotificationCenterDelegate

  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void
  ) {
    BrazeReactUtils
      .sharedInstance()
      .populateInitialPayload(
        fromLaunchOptions: response.notification.request.content.userInfo
      )
    let processedByBraze = BrazeManager.shared.handleUserNotification(
      response: response,
      completion: completionHandler
    )
    if processedByBraze {
      return
    }
    completionHandler()
  }

  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    willPresent notification: UNNotification,
    withCompletionHandler completionHandler: @escaping (
      UNNotificationPresentationOptions
    ) -> Void
  ) {
    if #available(
      iOS 14.0,
      *
    ) {
      completionHandler(
        [
          .list,
          .banner
        ]
      )
    } else {
      completionHandler(
        [.alert]
      )
    }
  }
  override func applicationDidBecomeActive(
    _ application: UIApplication
  ) {
    hideOverlay()
    UserDefaults.standard
      .set(
        false,
        forKey: "BiometricInProgressOverlay"
      )
  }

  override func applicationDidEnterBackground(
    _ application: UIApplication
  ) {
    showOverlay()
  }
  override func applicationWillEnterForeground(
    _ application: UIApplication
  ) {
    hideOverlay()
  }

  // MARK: - Linking / Universal Links

  override func application(
    _ application: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey : Any] = [:]
  ) -> Bool {
    return RCTLinkingManager
      .application(
        application,
        open: url,
        options: options
      )
  }

  override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping (
      [UIUserActivityRestoring]?
    ) -> Void
  ) -> Bool {
    return RCTLinkingManager
      .application(
        application,
        continue: userActivity,
        restorationHandler: restorationHandler
      )
  }
}

