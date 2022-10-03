/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function COB({ size, color }: Props): JSX.Element;
declare namespace COB {
    var DefaultColor: string;
}
export default COB;
