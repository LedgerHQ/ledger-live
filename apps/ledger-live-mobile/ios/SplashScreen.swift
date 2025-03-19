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

    @objc
    static func requiresMainQueueSetup() -> Bool {
        return true
    }

    @objc func showSplashScreen() {
        DispatchQueue.main.async {
            let appDelegate = UIApplication.shared.delegate
            let viewController = SplashScreenController()
            viewController.modalPresentationStyle = .fullScreen
            appDelegate?.window??.rootViewController?.present(viewController, animated: false)
        }
    }

    @objc func hideSplashScreen() {
        DispatchQueue.main.async {
            self.fadeOutAndDismissSplashScreen()
        }
    }

    private func fadeOutAndDismissSplashScreen() {
        guard let appDelegate = UIApplication.shared.delegate,
              let presentedViewController = appDelegate.window??.rootViewController?.presentedViewController as? SplashScreenController else {
            return
        }

        let fadeOutDuration = 0.3
        let scaleDownTransform = CGAffineTransform(scaleX: 0.95, y: 0.95)

        let animateFadeOutAndDismiss = {
            UIView.animate(withDuration: fadeOutDuration,
                           delay: 0,
                           options: .curveEaseOut,
                           animations: {
                               presentedViewController.view.alpha = 0
                               presentedViewController.view.transform = scaleDownTransform
                           },
                           completion: { _ in
                               presentedViewController.dismiss(animated: false) {
                                   presentedViewController.view.removeFromSuperview()
                               }
                           })
        }

        if presentedViewController.gifCompletedOnce {
            animateFadeOutAndDismiss()
        } else {
            presentedViewController.onGifCompletion = animateFadeOutAndDismiss
        }
    }
}
