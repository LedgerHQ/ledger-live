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

internal import Expo

import SharedNativePerformance

@main
class AppDelegate: ExpoAppDelegate, UNUserNotificationCenterDelegate {

  var window: UIWindow?
  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  private var launchedFromPush = false
  var overlayBlurView: UIVisualEffectView?
  var overlayLogoView: UIImageView?

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    AppStartupModule.recordLaunch(application)

    // Increase max concurrent HTTP connections per host (iOS default is 6) to reduce boot-time
    // request queuing. See: https://developer.apple.com/documentation/foundation/urlsessionconfiguration/httpmaximumconnectionsperhost
    RCTSetCustomNSURLSessionConfigurationProvider {
      let config = URLSessionConfiguration.default
      config.httpMaximumConnectionsPerHost = 16
      if let useWifiOnly = Bundle.main.infoDictionary?["ReactNetworkForceWifiOnly"] as? Bool, useWifiOnly {
        config.allowsCellularAccess = false
      }
      config.httpShouldSetCookies = true
      config.httpCookieAcceptPolicy = .always
      config.httpCookieStorage = HTTPCookieStorage.shared
      return config
    }

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

    UNUserNotificationCenter.current().delegate = self

    BrazeManager.shared.configure(
      pushAutoEnabled: pushAutoEnabled
    )

    #if targetEnvironment(simulator)
      // RNFB skips registerForRemoteNotifications on ARM64 simulators, so without this there is no APNs token.
      registerForPushNotifications()
    #else
      if !pushAutoEnabled {
        print(
          "iOS Push Auto disabled - Registering for push manually."
        )
        registerForPushNotifications()
      }
    #endif

    BrazeReactUtils
      .sharedInstance()
      .populateInitialPayload(
        fromLaunchOptions: launchOptions
      )

    launchedFromPush = launchOptions?[.remoteNotification] != nil

    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "ledgerlivemobile",
      in: window,
      launchOptions: launchOptions
    )

    let appLaunched = super.application(application, didFinishLaunchingWithOptions: launchOptions)

    if !appLaunched {
        return false
    }

    if ReactNativeDelegate.isRunningDetox {
      return true
    }

    UserDefaults.standard.set(
      false,
      forKey: AppKeys.UserDefaults.biometricInProgressOverlay
    )

    return true
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

  override func application(
    _ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
  ) {
    super.application(application, didRegisterForRemoteNotificationsWithDeviceToken: deviceToken)

    Messaging.messaging().apnsToken = deviceToken

    BrazeManager.shared.register(deviceToken: deviceToken)
  }

  // MARK: - UNUserNotificationCenterDelegate

  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void
  ) {
    let userInfo = response.notification.request.content.userInfo

    if launchedFromPush {
      launchedFromPush = false
    } else if let urlString = userInfo["ab_uri"] as? String,
              let url = URL(string: urlString) {
      RCTLinkingManager.application(
        UIApplication.shared,
        open: url,
        options: [:]
      )
    }

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
    super.applicationDidBecomeActive(application)
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
    super.applicationDidEnterBackground(application)
    showOverlay()
  }
  override func applicationWillEnterForeground(
    _ application: UIApplication
  ) {
    super.applicationWillEnterForeground(application)
    hideOverlay()
  }

  // MARK: - Linking / Universal Links

  override func application(
    _ application: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey : Any] = [:]
  ) -> Bool {
    return super.application(application, open: url, options: options)
      || RCTLinkingManager.application(application, open: url, options: options)
  }

  override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping (
      [UIUserActivityRestoring]?
    ) -> Void
  ) -> Bool {
    let handledByReactNative = RCTLinkingManager.application(
      application,
      continue: userActivity,
      restorationHandler: restorationHandler
    )
    return super.application(application, continue: userActivity, restorationHandler: restorationHandler)
      || handledByReactNative
  }
}

class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
  static let isRunningDetox = ProcessInfo.processInfo.arguments.contains("-IS_TEST")

  // Detox runs never show the native splash screen
  override func customize(_ rootView: UIView) {
    if Self.isRunningDetox {
      return
    }
    super.customize(rootView)
  }

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    return bridge.bundleURL ?? bundleURL()
  }

  override func bundleURL() -> URL? {
    #if DEBUG
      return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
    #else
      return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    #endif
  }
}

