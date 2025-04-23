//
//  LedgerLiveWidget.swift
//  LedgerLiveWidget
//
//  Created by Lucas WEREY on 23/04/2025.
//  Copyright © 2025 Ledger SAS. All rights reserved.
//

import WidgetKit
import SwiftUI

struct Provider: AppIntentTimelineProvider {
    let nfts: [SelectNFTIntent.NFTs: (imageURL: String, name: String)] = [
        .nft1: (
            imageURL: "https://i2.seadn.io/base/0xe26e46742f7a0d53e71dadfb890374e8d28dfb6e/3bf2b3068a80eca621fe542708ce27/733bf2b3068a80eca621fe542708ce27.png?w=1000",
            name: "Pudgy Penguin #2341"
        ),
        .nft2: (
            imageURL: "https://raw2.seadn.io/base/0x7e72abdf47bd21bf0ed6ea8cb8dad60579f3fb50/04540688a3db8873b8a4d57e9fd51c/f304540688a3db8873b8a4d57e9fd51c.png?w=1000",
            name: "Bored Ape #5137"
        ),
        .nft3: (
            imageURL: "https://i2.seadn.io/base/0x286ce4278213bf7b561763ebcf2342bb94e52858/0c99e94bdbfc95a1a74e4fcbca26520d.png?w=1000",
            name: "Azuki #5087"
        )
    ]


    func placeholder(in context: Context) -> SimpleEntry {
    let nftData = nfts[.nft1]!
    return SimpleEntry(date: Date(), nftURL: URL(string: nftData.imageURL), nftName: nftData.name, configuration: SelectNFTIntent())
}

    func snapshot(for configuration: SelectNFTIntent, in context: Context) async -> SimpleEntry {
        let nftData = nfts[configuration.selectedNFT ?? .nft1] ?? nfts[.nft1]!
        return SimpleEntry(date: Date(), nftURL: URL(string: nftData.imageURL), nftName: nftData.name, configuration: configuration)
    }

    func timeline(for configuration: SelectNFTIntent, in context: Context) async -> Timeline<SimpleEntry> {
        let nftData = nfts[configuration.selectedNFT ?? .nft1] ?? nfts[.nft1]!
        let entry = SimpleEntry(date: Date(), nftURL: URL(string: nftData.imageURL), nftName: nftData.name, configuration: configuration)
        return Timeline(entries: [entry], policy: .atEnd)
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let nftURL: URL?
    let nftName: String
    let configuration: SelectNFTIntent
}

struct NFTWidgetEntryView: View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var widgetFamily

    var body: some View {
        GeometryReader { geometry in
            ZStack(alignment: .topTrailing) {
                // Main NFT image
                if let url = entry.nftURL,
                   let imageData = try? Data(contentsOf: url),
                   let uiImage = UIImage(data: imageData) {

                    Image(uiImage: uiImage)
                        .resizable()
                        .scaledToFill()
                        .clipped()
                } else {
                    ProgressView()
                }

                // Logo overlay in top right corner
                Image("Image")
                    .resizable()
                    .frame(width: 24, height: 24)
                    .padding(14)

                if widgetFamily == .systemLarge {
                    VStack {
                        Spacer()
                        Text(entry.nftName)
                            .font(.headline)
                            .foregroundColor(.white)
                            .padding()
                            .background(ContainerRelativeShape().fill(Color.black.opacity(0.7)))
                    }
                    .padding(14)
                }
            }
        }
    }
}


struct NFTWidget: Widget {
    let kind: String = "LedgerLiveWidget"

    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: kind, intent: SelectNFTIntent.self, provider: Provider()) { entry in
          NFTWidgetEntryView(entry: entry)
                .background(Color.clear) // Ensure no background color
                .widgetURL(URL(string: "ledgerlive://account?currency=ethereum"))
        }
        .configurationDisplayName("NFT Widget")
        .description("Displays your favorite NFT.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge]) // Use the correct cases
        .disableContentMarginsIfNeeded()
    }
}

// Add the extension for WidgetConfiguration
extension WidgetConfiguration {
    func disableContentMarginsIfNeeded() -> some WidgetConfiguration {
        if #available(iOSApplicationExtension 17.0, *) {
            return self.contentMarginsDisabled()
        } else {
            return self
        }
    }
}

extension UIImage {
    func resized(toWidth width: CGFloat, isOpaque: Bool = true) -> UIImage? {
        let canvas = CGSize(width: width, height: CGFloat(ceil(width / size.width * size.height)))
        let format = imageRendererFormat
        format.opaque = isOpaque
        return UIGraphicsImageRenderer(size: canvas, format: format).image {
            _ in draw(in: CGRect(origin: .zero, size: canvas))
        }
    }
}

