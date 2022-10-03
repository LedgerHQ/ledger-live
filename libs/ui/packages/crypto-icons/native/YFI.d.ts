/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function YFI({ size, color }: Props): JSX.Element;
declare namespace YFI {
    var DefaultColor: string;
}
export default YFI;
