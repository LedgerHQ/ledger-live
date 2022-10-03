/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function COMP({ size, color }: Props): JSX.Element;
declare namespace COMP {
    var DefaultColor: string;
}
export default COMP;
