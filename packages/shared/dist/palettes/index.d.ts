export declare type ColorPalette = {
    type: string;
    primary: {
        c10: string;
        c20: string;
        c30: string;
        c40: string;
        c50: string;
        c60: string;
        c70: string;
        c80: string;
        c90: string;
        c100: string;
    };
    neutral: {
        c00: string;
        c20: string;
        c30: string;
        c40: string;
        c50: string;
        c60: string;
        c70: string;
        c80: string;
        c90: string;
        c100: string;
        c100a07: string;
    };
    success: {
        c10: string;
        c30: string;
        c40: string;
        c50: string;
        c60: string;
        c80: string;
        c100: string;
    };
    warning: {
        c10: string;
        c30: string;
        c40: string;
        c50: string;
        c60: string;
        c80: string;
        c100: string;
    };
    error: {
        c10: string;
        c30: string;
        c40: string;
        c50: string;
        c60: string;
        c80: string;
        c100: string;
    };
    constant: {
        overlay: string;
        white: string;
    };
    background: {
        main: string;
    };
};
export declare const palettes: {
    dark: ColorPalette;
    light: ColorPalette;
};
export declare type ThemeNames = keyof typeof palettes;
