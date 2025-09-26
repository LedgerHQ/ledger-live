import Expo
import UIKit
import UserNotifications
import React
import ReactAppDependencyProvider
import FirebaseCore
import BrazeKit
import RNSplashScreen

@objc(AppDelegate)
class AppDelegate: EXAppDelegateWrapper, UNUserNotificationCenterDelegate {

    static var braze: Braze?

    // Session/Startup tracking
    var hasLaunchedInThisSession: Bool = false
    var didInitialColdLaunchComplete: Bool = false
    var didEnterBackgroundSinceLastActive: Bool = false
    var launchStartTime: CFAbsoluteTime = CFAbsoluteTimeGetCurrent()
    var backgroundEnterTime: CFAbsoluteTime = 0.0

    private let iOSPushAutoEnabledKey = "iOSPushAutoEnabled"

    override init() {
        super.init()
    }

    override func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
        let currentExecutionPointTime = CFAbsoluteTimeGetCurrent()

        // React Native bootstrap
        self.moduleName = "ledgerlivemobile"
        self.dependencyProvider = RCTAppDependencyProvider()
        self.initialProps = [:]

        // Firebase configuration (environment-driven GoogleService-Info)
        let googleServiceInfoEnvName = RNCConfig.env(for: "GOOGLE_SERVICE_INFO_NAME") ?? ""
        let googleServiceInfoName = googleServiceInfoEnvName.isEmpty ? "GoogleService-Info" : googleServiceInfoEnvName
        if let filePath = Bundle.main.path(forResource: googleServiceInfoName, ofType: "plist"),
           let options = FirebaseOptions(contentsOfFile: filePath) {
            FirebaseApp.configure(options: options)
        }

        // Braze setup
        let brazeApiKeyFromEnv = RNCConfig.env(for: "BRAZE_IOS_API_KEY") ?? ""
        let brazeCustomEndpointFromEnv = RNCConfig.env(for: "BRAZE_CUSTOM_ENDPOINT") ?? ""
        var configuration = Braze.Configuration(apiKey: brazeApiKeyFromEnv, endpoint: brazeCustomEndpointFromEnv)
        configuration.triggerMinimumTimeInterval = 1
        configuration.logger.level = .info

        var pushAutoEnabled = true
        if UserDefaults.standard.object(forKey: iOSPushAutoEnabledKey) != nil {
            pushAutoEnabled = UserDefaults.standard.bool(forKey: iOSPushAutoEnabledKey)
        }
        if pushAutoEnabled {
            NSLog("iOS Push Auto enabled.")
            configuration.push.automation = Braze.Configuration.PushAutomation(enablingAllAutomations: true)
            configuration.push.automation?.requestAuthorizationAtLaunch = false
        }

        AppDelegate.braze = BrazeReactBridge.initBraze(configuration)

        if !pushAutoEnabled {
            NSLog("iOS Push Auto disabled - Registering for push manually.")
            self.registerForPushNotifications()
        }

        BrazeReactUtils.sharedInstance().populateInitialUrl(fromLaunchOptions: launchOptions)

        let appLaunched = super.application(application, didFinishLaunchingWithOptions: launchOptions)
        // Guard against RN crash in some versions
        if appLaunched == false { return false }

        // Initialize the 'hasLaunchedInThisSession' flag once per process
        struct Static { static var appProcessInitialized = false }
        if !Static.appProcessInitialized {
            self.hasLaunchedInThisSession = false
            Static.appProcessInitialized = true
        }

        // Determine startup type
        var startupType = "cold"
        var isRelaunchFromExternalEvent = false
        if launchOptions?[.sourceApplication] != nil ||
            launchOptions?[.url] != nil ||
            launchOptions?[.remoteNotification] != nil ||
            launchOptions?[.location] != nil ||
            launchOptions?[.bluetoothCentrals] != nil ||
            launchOptions?[.userActivityDictionary] != nil ||
            launchOptions?[.cloudKitShareMetadata] != nil ||
            launchOptions?[.shortcutItem] != nil {
            isRelaunchFromExternalEvent = true
        }

        let durationFromProcessStart = (currentExecutionPointTime - self.launchStartTime) * 1000
        if !self.didInitialColdLaunchComplete {
            startupType = isRelaunchFromExternalEvent ? "warm" : "cold"
            self.didInitialColdLaunchComplete = true
        } else if isRelaunchFromExternalEvent {
            startupType = "warm"
        }

        StartupInfoModule.setStartupType(startupType, duration: durationFromProcessStart)

        // Detox testing
        let isRunningDetox = ProcessInfo.processInfo.arguments.contains("-IS_TEST")
        if isRunningDetox { return true }

        // Splash screen
        _ = self.window?.rootViewController?.view
        RNSplashScreen.show()

        return true
    }

    // MARK: - Push Notifications

    func registerForPushNotifications() {
        let center = UNUserNotificationCenter.current()
        center.setNotificationCategories(BRZNotifications.categories)
        center.delegate = self
        UIApplication.shared.registerForRemoteNotifications()
    }

    func application(_ application: UIApplication,
                     didReceiveRemoteNotification userInfo: [AnyHashable : Any],
                     fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
        if let braze = AppDelegate.braze,
           braze.notifications.handleBackgroundNotification(userInfo: userInfo, fetchCompletionHandler: completionHandler) {
            return
        }
        completionHandler(.noData)
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                didReceive response: UNNotificationResponse,
                                withCompletionHandler completionHandler: @escaping () -> Void) {
        BrazeReactUtils.sharedInstance().populateInitialUrl(forCategories: response.notification.request.content.userInfo)
        if let braze = AppDelegate.braze,
           braze.notifications.handleUserNotification(response, withCompletionHandler: completionHandler) {
            return
        }
        completionHandler()
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                willPresent notification: UNNotification,
                                withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        if #available(iOS 14.0, *) {
            completionHandler([.list, .banner])
        } else {
            completionHandler([.alert])
        }
    }

    func application(_ application: UIApplication,
                     didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        AppDelegate.braze?.notifications.register(deviceToken: deviceToken)
    }

    // MARK: - Overlay blur for backgrounding

    func showOverlay() {
        guard let window = self.window else { return }
        let blurEffect = UIBlurEffect(style: .regular)
        let blurEffectView = UIVisualEffectView(effect: blurEffect)
        let logoView = UIImageView(image: UIImage(named: "Blurry_nocache1"))
        logoView.contentMode = .scaleAspectFit

        blurEffectView.frame = window.bounds
        blurEffectView.tag = 12345
        logoView.tag = 12346

        blurEffectView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        window.addSubview(blurEffectView)
        window.addSubview(logoView)
        window.bringSubviewToFront(logoView)

        logoView.setContentHuggingPriority(UILayoutPriority(251), for: .horizontal)
        logoView.setContentHuggingPriority(UILayoutPriority(251), for: .vertical)
        logoView.frame = CGRect(x: 0, y: 0, width: 128, height: 128)

        logoView.center = CGPoint(x: window.frame.size.width / 2, y: window.frame.size.height / 2)
    }

    func hideOverlay() {
        guard let window = self.window else { return }
        guard let blurEffectView = window.viewWithTag(12345), let logoView = window.viewWithTag(12346) else { return }

        UIView.animate(withDuration: 0.5, animations: {
            blurEffectView.alpha = 0
            logoView.alpha = 0
        }) { _ in
            blurEffectView.removeFromSuperview()
            logoView.removeFromSuperview()
        }
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        let resumeStartTime = CFAbsoluteTimeGetCurrent()
        self.hideOverlay()

        if self.didInitialColdLaunchComplete && self.didEnterBackgroundSinceLastActive {
            let warmThreshold: CFAbsoluteTime = 5.0
            let timeInBackground = resumeStartTime - self.backgroundEnterTime
            let startupType = timeInBackground > warmThreshold ? "warm" : "hot"

            let activationDuration = CFAbsoluteTimeGetCurrent() - resumeStartTime
            StartupInfoModule.setStartupType(startupType, duration: activationDuration)
        }

        self.didEnterBackgroundSinceLastActive = false
        self.backgroundEnterTime = 0.0
    }

    func applicationWillResignActive(_ application: UIApplication) {
        self.showOverlay()
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        self.didEnterBackgroundSinceLastActive = true
        self.backgroundEnterTime = CFAbsoluteTimeGetCurrent()
    }

    // MARK: - RN Bundle URL

    override func sourceURL(for bridge: RCTBridge!) -> URL! {
        return self.bundleURL()
    }

    override func bundleURL() -> URL! {
        #if DEBUG
        return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
        #else
        return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
        #endif
    }

    // MARK: - React 18 Concurrent Root

    override func concurrentRootEnabled() -> Bool {
        return true
    }

    // MARK: - Deep links / universal links

    @objc
    override func application(_ application: UIApplication,
                              open url: URL,
                              options: [UIApplication.OpenURLOptionsKey : Any] = [:]) -> Bool {
        return RCTLinkingManager.application(application, open: url, options: options)
    }

    @objc
    override func application(_ application: UIApplication,
                              continue userActivity: NSUserActivity,
                              restorationHandler: @escaping ([UIUserActivityRestoring]) -> Void) -> Bool {
        return RCTLinkingManager.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }
}

