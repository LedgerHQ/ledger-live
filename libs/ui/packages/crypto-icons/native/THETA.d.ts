/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function THETA({ size, color }: Props): JSX.Element;
declare namespace THETA {
    var DefaultColor: string;
}
export default THETA;
