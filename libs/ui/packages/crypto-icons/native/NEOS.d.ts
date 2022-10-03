/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function NEOS({ size, color }: Props): JSX.Element;
declare namespace NEOS {
    var DefaultColor: string;
}
export default NEOS;
