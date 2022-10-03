/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function RISE({ size, color }: Props): JSX.Element;
declare namespace RISE {
    var DefaultColor: string;
}
export default RISE;
