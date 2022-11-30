const palette = {
  Black: "#282c34",
  White: "#abb2bf",
  LightRed: "#e06c75",
  DarkRed: "#be5046",
  Green: "#98c379",
  LightYellow: "#e5c07b",
  DarkYellow: "#d19a66",
  Blue: "#61afef",
  Magenta: "#c678dd",
  Cyan: "#56b6c2",
  GutterGrey: "#4b5263",
  CommentGrey: "#5c6370"
};

const theme = {
  palette,
  background: palette.Black,
  darkBackground: "#21252c",
  text: palette.White,
  button: palette.Blue,
  buttonRed: palette.DarkRed,
  buttonText: "#fff",
  buttonDisabled: "#eee",
  buttonDisabledText: "#999",
  tabEnabledText: palette.Blue,
  tabDisabledText: "rgba(255,255,255,0.2)",
  formLeftBorder: palette.GutterGrey,
  logTypes: {
    error: palette.DarkRed,
    warn: palette.DarkYellow,
    command: palette.Magenta,
    apdu: palette.Blue,
    binary: palette.Green,
    verbose: palette.White,
    announcement: palette.LightYellow
  }
};

export default theme;
