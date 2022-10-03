/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function MIOTA({ size, color }: Props): JSX.Element;
declare namespace MIOTA {
    var DefaultColor: string;
}
export default MIOTA;
