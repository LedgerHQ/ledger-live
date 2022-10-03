/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function GUSD({ size, color }: Props): JSX.Element;
declare namespace GUSD {
    var DefaultColor: string;
}
export default GUSD;
