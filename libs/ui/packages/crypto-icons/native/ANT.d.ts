/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function ANT({ size, color }: Props): JSX.Element;
declare namespace ANT {
    var DefaultColor: string;
}
export default ANT;
