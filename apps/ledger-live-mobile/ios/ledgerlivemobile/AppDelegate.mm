#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <React/RCTLinkingManager.h>
#import "ReactNativeConfig.h"
#import "RNSplashScreen.h"  // here
#import <BrazeKit/BrazeKit-Swift.h>
#import "BrazeReactUtils.h"
#import "BrazeReactBridge.h"

#import <Firebase.h>

#if DEBUG
#ifdef FB_SONARKIT_ENABLED
#import <FlipperKit/FlipperClient.h>
#import <FlipperKitLayoutPlugin/FlipperKitLayoutPlugin.h>
#import <FlipperKitLayoutPlugin/SKDescriptorMapper.h>
#import <FlipperKitNetworkPlugin/FlipperKitNetworkPlugin.h>
#import <FlipperKitReactPlugin/FlipperKitReactPlugin.h>
#import <FlipperKitUserDefaultsPlugin/FKUserDefaultsPlugin.h>
#import <FlipperPerformancePlugin.h> // react-native-performance-plugin
#import <SKIOSNetworkPlugin/SKIOSNetworkAdapter.h>
#endif
#endif

@implementation AppDelegate

static NSString *const iOSPushAutoEnabledKey = @"iOSPushAutoEnabled";

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"ledgerlivemobile";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

  // Retrieve the correct GoogleService-Info.plist file name for a given environment
  NSString *googleServiceInfoEnvName = [ReactNativeConfig envFor:@"GOOGLE_SERVICE_INFO_NAME"];
  NSString *googleServiceInfoName = googleServiceInfoEnvName;
  
  if ([googleServiceInfoName length] == 0) {
    googleServiceInfoName = @"GoogleService-Info";
  }
  
  // Initialize Firebase with the correct GoogleService-Info.plist file
  NSString *filePath = [[NSBundle mainBundle] pathForResource:googleServiceInfoName ofType:@"plist"];
  FIROptions *options = [[FIROptions alloc] initWithContentsOfFile:filePath];
  [FIRApp configureWithOptions:options];
  
  // Setup Braze
  NSString *brazeApiKeyFromEnv = [ReactNativeConfig envFor:@"BRAZE_IOS_API_KEY"];
  NSString *brazeCustomEndpointFromEnv = [ReactNativeConfig envFor:@"BRAZE_CUSTOM_ENDPOINT"];

  BRZConfiguration *configuration = [[BRZConfiguration alloc] initWithApiKey:brazeApiKeyFromEnv endpoint:brazeCustomEndpointFromEnv];
  configuration.triggerMinimumTimeInterval = 1;
  configuration.logger.level = BRZLoggerLevelInfo;

  // Default to automically set up push notifications
  BOOL pushAutoEnabled = YES;
  if ([[NSUserDefaults standardUserDefaults] objectForKey:iOSPushAutoEnabledKey]) {
    pushAutoEnabled = [[NSUserDefaults standardUserDefaults] boolForKey:iOSPushAutoEnabledKey];
  }
  if (pushAutoEnabled) {
    NSLog(@"iOS Push Auto enabled.");
    configuration.push.automation =
        [[BRZConfigurationPushAutomation alloc] initEnablingAllAutomations:YES];
    configuration.push.automation.requestAuthorizationAtLaunch = NO;
  }

  Braze *braze = [BrazeReactBridge initBraze:configuration];
  AppDelegate.braze = braze;

  if (!pushAutoEnabled) {
    // If the user explicitly disables Push Auto, register for push manually
    NSLog(@"iOS Push Auto disabled - Registering for push manually.");
    [self registerForPushNotifications];
  }

  [[BrazeReactUtils sharedInstance] populateInitialUrlFromLaunchOptions:launchOptions];
    
  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (void)registerForPushNotifications {
  UNUserNotificationCenter *center = UNUserNotificationCenter.currentNotificationCenter;
  [center setNotificationCategories:BRZNotifications.categories];
  center.delegate = self;
  [UIApplication.sharedApplication registerForRemoteNotifications];
  // Authorization is requested later in the JavaScript layer via `Braze.requestPushPermission`.
}

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler {
  BOOL processedByBraze = AppDelegate.braze != nil && [AppDelegate.braze.notifications handleBackgroundNotificationWithUserInfo:userInfo
                                                                                                         fetchCompletionHandler:completionHandler];
  if (processedByBraze) {
    return;
  }

  completionHandler(UIBackgroundFetchResultNoData);
}

- (void)userNotificationCenter:(UNUserNotificationCenter *)center
  didReceiveNotificationResponse:(UNNotificationResponse *)response
         withCompletionHandler:(void (^)(void))completionHandler {
  [[BrazeReactUtils sharedInstance] populateInitialUrlForCategories:response.notification.request.content.userInfo];
  BOOL processedByBraze = AppDelegate.braze != nil && [AppDelegate.braze.notifications handleUserNotificationWithResponse:response
                                                                                                    withCompletionHandler:completionHandler];
  if (processedByBraze) {
    return;
  }

  completionHandler();
}

- (void)userNotificationCenter:(UNUserNotificationCenter *)center
       willPresentNotification:(UNNotification *)notification
         withCompletionHandler:(void (^)(UNNotificationPresentationOptions options))completionHandler {
  if (@available(iOS 14.0, *)) {
    completionHandler(UNNotificationPresentationOptionList | UNNotificationPresentationOptionBanner);
  } else {
    completionHandler(UNNotificationPresentationOptionAlert);
  }
}

- (void)application:(UIApplication *)application
  didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken {
  [AppDelegate.braze.notifications registerDeviceToken:deviceToken];
}

static Braze *_braze;

+ (Braze *)braze {
  return _braze;
}

+ (void)setBraze:(Braze *)braze {
  _braze = braze;
}

- (void) showOverlay{
  UIBlurEffect *blurEffect = [UIBlurEffect effectWithStyle:UIBlurEffectStyleRegular];
  UIVisualEffectView *blurEffectView = [[UIVisualEffectView alloc] initWithEffect:blurEffect];
  UIImageView *logoView = [[UIImageView alloc]initWithImage:[UIImage imageNamed:@"Blurry_nocache1"]];
  logoView.contentMode = UIViewContentModeScaleAspectFit;
  blurEffectView.frame = [self.window bounds];
  blurEffectView.tag = 12345;
  logoView.tag = 12346;
  
  blurEffectView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  [self.window addSubview:blurEffectView];
  [self.window addSubview:logoView];
  [self.window bringSubviewToFront:logoView];
  
  [logoView setContentHuggingPriority:251 forAxis:UILayoutConstraintAxisHorizontal];
  [logoView setContentHuggingPriority:251 forAxis:UILayoutConstraintAxisVertical];
  logoView.frame = CGRectMake(0, 0, 128, 128);
  
  logoView.center = CGPointMake(self.window.frame.size.width  / 2,self.window.frame.size.height / 2);
}

- (void) hideOverlay{
  UIView *blurEffectView = [self.window viewWithTag:12345];
  UIView *logoView = [self.window viewWithTag:12346];
  
  [UIView animateWithDuration:0.5 animations:^{
    blurEffectView.alpha = 0;
    logoView.alpha = 0;
  } completion:^(BOOL finished) {
    // remove when finished fading
    [blurEffectView removeFromSuperview];
    [logoView removeFromSuperview];
  }];
}

- (void)applicationDidBecomeActive:(UIApplication *)application {
  [self hideOverlay];
}

- (void)applicationDidEnterBackground:(UIApplication *)application {
  [self showOverlay];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

/// This method controls whether the `concurrentRoot`feature of React18 is turned on or off.
///
/// @see: https://reactjs.org/blog/2022/03/29/react-v18.html
/// @note: This requires to be rendering on Fabric (i.e. on the New Architecture).
/// @return: `true` if the `concurrentRoot` feature is enabled. Otherwise, it returns `false`.
- (BOOL)concurrentRootEnabled
{
  return true;
}

- (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)url
            options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  return [RCTLinkingManager application:application openURL:url options:options];
}

// Handle universal links -> forwarding URL to RCTLinkingManager lib
// similar implementation as the method above (application:openURL:options)
- (BOOL)application:(UIApplication *)application
continueUserActivity:(NSUserActivity *)userActivity
 restorationHandler:(void (^)(NSArray<id<UIUserActivityRestoring>> *restorableObjects))restorationHandler
{
  NSURL *url = userActivity.webpageURL;
  return [RCTLinkingManager application:application
                   continueUserActivity:userActivity
                     restorationHandler:restorationHandler];
}

@end

