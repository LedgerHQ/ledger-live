/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function POWR({ size, color }: Props): JSX.Element;
declare namespace POWR {
    var DefaultColor: string;
}
export default POWR;
