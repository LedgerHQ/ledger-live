//
//  FirebaseConfigurator.swift
//  ledgerlivemobile
//
//  Created by Lucas WEREY on 01/12/2025.
//  Copyright © 2025 Ledger SAS. All rights reserved.
//


import Foundation
import FirebaseCore
import react_native_config

enum FirebaseConfigurator {
  static func configure() {
    let envName = RNCConfig.env(for: "GOOGLE_SERVICE_INFO_NAME") ?? ""
    let plistName = envName.isEmpty ? "GoogleService-Info" : envName

    if let filePath = Bundle.main.path(forResource: plistName, ofType: "plist"),
       let options = FirebaseOptions(contentsOfFile: filePath) {
      FirebaseApp.configure(options: options)
    } else {
      FirebaseApp.configure()
    }
  }
}
