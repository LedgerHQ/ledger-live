//
//  LedgerLiveWidgetLiveActivity.swift
//  LedgerLiveWidget
//
//  Created by Lucas WEREY on 23/04/2025.
//  Copyright © 2025 Ledger SAS. All rights reserved.
//

import ActivityKit
import WidgetKit
import SwiftUI

struct LedgerLiveWidgetAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        // Dynamic stateful properties about your activity go here!
        var emoji: String
    }

    // Fixed non-changing properties about your activity go here!
    var name: String
}

struct LedgerLiveWidgetLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: LedgerLiveWidgetAttributes.self) { context in
            // Lock screen/banner UI goes here
            VStack {
                Text("Hello \(context.state.emoji)")
            }
            .activityBackgroundTint(Color.cyan)
            .activitySystemActionForegroundColor(Color.black)

        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded UI goes here.  Compose the expanded UI through
                // various regions, like leading/trailing/center/bottom
                DynamicIslandExpandedRegion(.leading) {
                    Text("Leading")
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("Trailing")
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text("Bottom \(context.state.emoji)")
                    // more content
                }
            } compactLeading: {
                Text("L")
            } compactTrailing: {
                Text("T \(context.state.emoji)")
            } minimal: {
                Text(context.state.emoji)
            }
            .widgetURL(URL(string: "http://www.apple.com"))
            .keylineTint(Color.red)
        }
    }
}

extension LedgerLiveWidgetAttributes {
    fileprivate static var preview: LedgerLiveWidgetAttributes {
        LedgerLiveWidgetAttributes(name: "World")
    }
}

extension LedgerLiveWidgetAttributes.ContentState {
    fileprivate static var smiley: LedgerLiveWidgetAttributes.ContentState {
        LedgerLiveWidgetAttributes.ContentState(emoji: "😀")
     }
     
     fileprivate static var starEyes: LedgerLiveWidgetAttributes.ContentState {
         LedgerLiveWidgetAttributes.ContentState(emoji: "🤩")
     }
}

//#Preview("Notification", as: .content, using: LedgerLiveWidgetAttributes.preview) {
//   LedgerLiveWidgetLiveActivity()
//} contentStates: {
//    LedgerLiveWidgetAttributes.ContentState.smiley
//    LedgerLiveWidgetAttributes.ContentState.starEyes
//}
