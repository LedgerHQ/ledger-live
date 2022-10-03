/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function EVX({ size, color }: Props): JSX.Element;
declare namespace EVX {
    var DefaultColor: string;
}
export default EVX;
