/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function RHOC({ size, color }: Props): JSX.Element;
declare namespace RHOC {
    var DefaultColor: string;
}
export default RHOC;
