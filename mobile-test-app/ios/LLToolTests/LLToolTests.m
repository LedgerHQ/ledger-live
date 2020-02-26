/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>
#import <XCTest/XCTest.h>

#import <React/RCTLog.h>
#import <React/RCTRootView.h>

#define TIMEOUT_SECONDS 1800
#define SUCCESSTEXT @"success OVERALL"
#define ERRORTEXT @"failure OVERALL"

@interface LLToolTests : XCTestCase

@end

@implementation LLToolTests

- (void)invokeTest
{
  self.continueAfterFailure = NO;
  
  @try {
    [super invokeTest];
  } @finally {
    self.continueAfterFailure = YES;
  }
}

- (BOOL)findSubviewInView:(UIView *)view matching:(BOOL(^)(UIView *view))test
{
  if (test(view)) {
    return YES;
  }
  for (UIView *subview in [view subviews]) {
    if ([self findSubviewInView:subview matching:test]) {
      return YES;
    }
  }
  return NO;
}

- (void)testRendersWelcomeScreen
{
  UIViewController *vc = [[[RCTSharedApplication() delegate] window] rootViewController];
  NSDate *date = [NSDate dateWithTimeIntervalSinceNow:TIMEOUT_SECONDS];
  BOOL foundElement = NO;

  while ([date timeIntervalSinceNow] > 0 && !foundElement) {
    [[NSRunLoop mainRunLoop] runMode:NSDefaultRunLoopMode beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
    [[NSRunLoop mainRunLoop] runMode:NSRunLoopCommonModes beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];

    foundElement = [self findSubviewInView:vc.view matching:^BOOL(UIView *view) {
      if ([view.accessibilityLabel isEqualToString:SUCCESSTEXT]) {
        return YES;
      }
      return NO;
    }];


    XCTAssertTrue(![self findSubviewInView:vc.view matching:^BOOL(UIView *view) {
      if ([view.accessibilityLabel isEqualToString:ERRORTEXT]) {
        return YES;
      }
      return NO;
    }], @"error was found"); // TODO how to get the actual text of the error.
  }

#ifdef DEBUG
  RCTSetLogFunction(RCTDefaultLogFunction);
#endif

  XCTAssertTrue(foundElement, @"Couldn't find element with text '%@' in %d seconds", SUCCESSTEXT, TIMEOUT_SECONDS);
}


@end
