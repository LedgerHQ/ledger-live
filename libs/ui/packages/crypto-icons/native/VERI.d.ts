/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function VERI({ size, color }: Props): JSX.Element;
declare namespace VERI {
    var DefaultColor: string;
}
export default VERI;
