//
//  Overlay.swift
//  ledgerlivemobile
//
//  Created by Lucas WEREY on 01/12/2025.
//  Copyright © 2025 Ledger SAS. All rights reserved.
//

import UIKit

extension AppDelegate {
  func showOverlay() {
    guard overlayBlurView == nil else { return }

    let blurEffect = UIBlurEffect(style: .regular)
    let blurEffectView = UIVisualEffectView(effect: blurEffect)
    let logoView = UIImageView(image: UIImage(named: "Blurry_nocache1"))
    logoView.contentMode = .scaleAspectFit

    let window = self.window
    blurEffectView.frame = window.bounds
    blurEffectView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    window.addSubview(blurEffectView)
    window.addSubview(logoView)
    window.bringSubviewToFront(logoView)

    logoView.setContentHuggingPriority(UILayoutPriority(251), for: .horizontal)
    logoView.setContentHuggingPriority(UILayoutPriority(251), for: .vertical)
    logoView.frame = CGRect(x: 0, y: 0, width: 128, height: 128)
    logoView.center = CGPoint(x: window.frame.size.width / 2, y: window.frame.size.height / 2)

    overlayBlurView = blurEffectView
    overlayLogoView = logoView
  }

  func hideOverlay() {
    guard let blurEffectView = overlayBlurView, let logoView = overlayLogoView else { return }
    overlayBlurView = nil
    overlayLogoView = nil

    UIView.animate(withDuration: 0.5, animations: {
      blurEffectView.alpha = 0
      logoView.alpha = 0
    }, completion: { _ in
      blurEffectView.removeFromSuperview()
      logoView.removeFromSuperview()
    })
  }
}
