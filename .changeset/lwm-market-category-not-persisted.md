---
"live-mobile": patch
---

Market screen category fixes (mobile):

- The selected category is no longer persisted — opening the Market list always starts on the "all" category (a route param such as "stocks" still sets the initial category for that visit). The category was removed from the persisted `marketListConfig` redux slice and is now local screen state.
- Fixed the category filter tabs not switching when a category was pre-selected (e.g. arriving from a "stocks" link): the previous logic re-applied the route category on every change, reverting the tap. Tabs are now plain local state, so any tab can be selected.
