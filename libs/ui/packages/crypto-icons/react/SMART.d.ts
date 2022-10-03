/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function SMART({ size, color }: Props): JSX.Element;
declare namespace SMART {
    var DefaultColor: string;
}
export default SMART;
