#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <React/RCTLinkingManager.h>
#import "ReactNativeConfig.h"
#import "RNSplashScreen.h"  // here
#import "Appboy-iOS-SDK/AppboyKit.h"
#import "AppboyReactUtils.h"

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

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"ledgerlivemobile";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

  // Initialize Braze
  NSString *brazeApiKeyFromEnv = [ReactNativeConfig envFor:@"BRAZE_IOS_API_KEY"];
  [Appboy startWithApiKey:brazeApiKeyFromEnv inApplication:application withLaunchOptions:launchOptions];

  if (floor(NSFoundationVersionNumber) > NSFoundationVersionNumber_iOS_9_x_Max) {
    UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
    center.delegate = self;
    UNAuthorizationOptions options = UNAuthorizationOptionAlert | UNAuthorizationOptionSound | UNAuthorizationOptionBadge;
    if (@available(iOS 12.0, *)) {
    options = options | UNAuthorizationOptionProvisional;
    }
    [center requestAuthorizationWithOptions:options
                          completionHandler:^(BOOL granted, NSError * _Nullable error) {
                            [[Appboy sharedInstance] pushAuthorizationFromUserNotificationCenter:granted];
    }];
    [[UIApplication sharedApplication] registerForRemoteNotifications];
  } else {
    UIUserNotificationSettings *settings = [UIUserNotificationSettings settingsForTypes:(UIUserNotificationTypeBadge | UIUserNotificationTypeAlert | UIUserNotificationTypeSound) categories:nil];
    [[UIApplication sharedApplication] registerForRemoteNotifications];
    [[UIApplication sharedApplication] registerUserNotificationSettings:settings];
  }

  [[AppboyReactUtils sharedInstance] populateInitialUrlFromLaunchOptions:launchOptions];

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

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
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

- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken {
  [[Appboy sharedInstance] registerDeviceToken:deviceToken];
}

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler {
  [[Appboy sharedInstance] registerApplication:application didReceiveRemoteNotification:userInfo fetchCompletionHandler:completionHandler];
}

- (void)userNotificationCenter:(UNUserNotificationCenter *)center didReceiveNotificationResponse:(UNNotificationResponse *)response withCompletionHandler:(void (^)(void))completionHandler {
  [[Appboy sharedInstance] userNotificationCenter:center didReceiveNotificationResponse:response withCompletionHandler:completionHandler];
}

- (void)userNotificationCenter:(UNUserNotificationCenter *)center willPresentNotification:(UNNotification *)notification withCompletionHandler:(void (^)(UNNotificationPresentationOptions options))completionHandler {
  if (@available(iOS 14.0, *)) {
    completionHandler(UNNotificationPresentationOptionList | UNNotificationPresentationOptionBanner);
  } else {
    completionHandler(UNNotificationPresentationOptionAlert);
  }
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

@end
