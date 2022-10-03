/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function MTH({ size, color }: Props): JSX.Element;
declare namespace MTH {
    var DefaultColor: string;
}
export default MTH;
