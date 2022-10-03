/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function SUB({ size, color }: Props): JSX.Element;
declare namespace SUB {
    var DefaultColor: string;
}
export default SUB;
