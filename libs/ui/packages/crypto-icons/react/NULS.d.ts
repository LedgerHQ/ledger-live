/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function NULS({ size, color }: Props): JSX.Element;
declare namespace NULS {
    var DefaultColor: string;
}
export default NULS;
