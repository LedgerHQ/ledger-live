---
"live-mobile": minor
"ledger-live-desktop": minor
---

chore(lumen): bump ui-rnative to 0.1.72 for rn 0.86 (LIVE-39312)

Bump lumen-ui-rnative to 0.1.72, lumen-ui-react to 0.1.69 and lumen-utils-shared to 0.1.19. The new lumen-ui-rnative peer ranges accept react-native 0.86, react-native-worklets 0.10 and expo-haptics 57. Lumen native inputs now expose their label as the TextInput accessibility label and hide the visual label from accessibility, so mobile tests query these inputs with `getByLabelText`.
