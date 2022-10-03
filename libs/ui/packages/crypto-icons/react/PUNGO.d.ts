/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function PUNGO({ size, color }: Props): JSX.Element;
declare namespace PUNGO {
    var DefaultColor: string;
}
export default PUNGO;
