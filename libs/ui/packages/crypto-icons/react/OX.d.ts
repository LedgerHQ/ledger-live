/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function OX({ size, color }: Props): JSX.Element;
declare namespace OX {
    var DefaultColor: string;
}
export default OX;
