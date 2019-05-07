/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "AppDelegate.h"

#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#if __has_include(<React/RNSentry.h>)
#import <React/RNSentry.h> // This is used for versions of react >= 0.40
#else
#import "RNSentry.h" // This is used for versions of react < 0.40
#endif
#import <React/RCTLinkingManager.h>
#import "RNSplashScreen.h"

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  
  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge
                                                   moduleName:@"ledgerlivemobile"
                                            initialProperties:nil];
  
  [RNSentry installWithRootView:rootView];

  rootView.backgroundColor = [[UIColor alloc] initWithRed:1.0f green:1.0f blue:1.0f alpha:1];

  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];
  #ifndef DEBUG
    [RNSplashScreen show];
  #endif
  return YES;
}

- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url
  sourceApplication:(NSString *)sourceApplication annotation:(id)annotation
{
  return [RCTLinkingManager application:application openURL:url
                      sourceApplication:sourceApplication annotation:annotation];
}

- (BOOL)application:(UIApplication *)application continueUserActivity:(NSUserActivity *)userActivity
 restorationHandler:(void (^)(NSArray * _Nullable))restorationHandler
{
  return [RCTLinkingManager application:application
                   continueUserActivity:userActivity
                     restorationHandler:restorationHandler];
}

- (void)applicationWillResignActive:(UIApplication *)application {
  UIBlurEffect *blurEffect = [UIBlurEffect effectWithStyle:UIBlurEffectStyleRegular];
  UIVisualEffectView *blurEffectView = [[UIVisualEffectView alloc] initWithEffect:blurEffect];
  UIImageView *logoView = [[UIImageView alloc]initWithImage:[UIImage imageNamed:@"Blurry"]];
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

- (void)applicationDidBecomeActive:(UIApplication *)application {
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

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end
