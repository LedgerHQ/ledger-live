/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function PAX({ size, color }: Props): JSX.Element;
declare namespace PAX {
    var DefaultColor: string;
}
export default PAX;
