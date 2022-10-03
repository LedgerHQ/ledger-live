/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function AMB({ size, color }: Props): JSX.Element;
declare namespace AMB {
    var DefaultColor: string;
}
export default AMB;
