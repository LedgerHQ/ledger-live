//
//  SplashScreen.swift
//  ledgerlivemobile
//
//  Created by Lucas WEREY on 17/03/2025.
//  Copyright © 2025 Ledger SAS. All rights reserved.
//

import Foundation
import React
import UIKit

@objc(RNSplashScreenModule)
public class RNSplashScreenModule: NSObject {
    private static var isRunningTests: Bool {
        return ProcessInfo.processInfo.environment["RUNNING_TESTS"] == "1"
    }

    @objc
    static func requiresMainQueueSetup() -> Bool {
        return true
    }

    @objc func showSplashScreen() {
        if Self.isRunningTests {
            return
        }

        DispatchQueue.main.async {
            let appDelegate = UIApplication.shared.delegate
            let viewController = SplashScreenController()
            viewController.modalPresentationStyle = .fullScreen
            appDelegate?.window??.rootViewController?.present(
                viewController, animated: false)
        }
    }

    @objc func hideSplashScreen() {
        if Self.isRunningTests {
            return
        }

        DispatchQueue.main.async {
            let appDelegate = UIApplication.shared.delegate
            if let presentedViewController = appDelegate?.window??.rootViewController?
                .presentedViewController as? SplashScreenController
            {
                if Self.isRunningTests {
                    presentedViewController.dismiss(animated: false) {
                        presentedViewController.view.removeFromSuperview()
                    }
                    return
                }

                let fadeOutDuration = 0.2
                let scaleDownTransform = CGAffineTransform(scaleX: 0.95, y: 0.95)

                let animateFadeOutAndDismiss = {
                    UIView.animate(
                        withDuration: fadeOutDuration,
                        animations: {
                            presentedViewController.view.alpha = 0
                            presentedViewController.view.transform = scaleDownTransform
                        }
                    ) { _ in
                        presentedViewController.dismiss(animated: false) {
                            presentedViewController.view.removeFromSuperview()
                        }
                    }
                }

                if presentedViewController.gifCompletedOnce {
                    animateFadeOutAndDismiss()
                } else {
                    presentedViewController.onGifCompletion = {
                        animateFadeOutAndDismiss()
                    }
                }
            }
        }
    }
}
