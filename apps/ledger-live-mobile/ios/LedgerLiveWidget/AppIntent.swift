//
//  AppIntent.swift
//  LedgerLiveWidget
//
//  Created by Lucas WEREY on 23/04/2025.
//  Copyright © 2025 Ledger SAS. All rights reserved.
//

import WidgetKit
import AppIntents

struct SelectNFTIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource = "Select NFT"
    static var description = IntentDescription("Allows the user to select which NFT to display on the widget.")

    @Parameter(title: "NFT")
    var selectedNFT: NFTs?

    enum NFTs: String, CaseIterable, AppEnum {
        case nft1 = "NFT 1"
        case nft2 = "NFT 2"
        case nft3 = "NFT 3"

        static var typeDisplayRepresentation: TypeDisplayRepresentation = "NFT"
        static var caseDisplayRepresentations: [Self: DisplayRepresentation] = [
            .nft1: "Pudgy Penguin #2341",
            .nft2: "#5137",
            .nft3: "Azuki #5087",
        ]
    }
}
