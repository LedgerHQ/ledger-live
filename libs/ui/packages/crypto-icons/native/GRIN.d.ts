/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function GRIN({ size, color }: Props): JSX.Element;
declare namespace GRIN {
    var DefaultColor: string;
}
export default GRIN;
