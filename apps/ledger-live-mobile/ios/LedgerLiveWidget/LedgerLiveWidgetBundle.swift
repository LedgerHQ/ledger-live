//
//  LedgerLiveWidgetBundle.swift
//  LedgerLiveWidget
//
//  Created by Lucas WEREY on 23/04/2025.
//  Copyright © 2025 Ledger SAS. All rights reserved.
//

import WidgetKit
import SwiftUI

@main
struct LedgerLiveWidgetBundle: WidgetBundle {
    var body: some Widget {
        NFTWidget()
        LedgerLiveWidgetControl()
        LedgerLiveWidgetLiveActivity()
    }
}
