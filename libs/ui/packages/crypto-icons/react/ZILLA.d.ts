/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function ZILLA({ size, color }: Props): JSX.Element;
declare namespace ZILLA {
    var DefaultColor: string;
}
export default ZILLA;
