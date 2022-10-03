/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function MTL({ size, color }: Props): JSX.Element;
declare namespace MTL {
    var DefaultColor: string;
}
export default MTL;
