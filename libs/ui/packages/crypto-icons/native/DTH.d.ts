/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function DTH({ size, color }: Props): JSX.Element;
declare namespace DTH {
    var DefaultColor: string;
}
export default DTH;
