/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function VIVO({ size, color }: Props): JSX.Element;
declare namespace VIVO {
    var DefaultColor: string;
}
export default VIVO;
