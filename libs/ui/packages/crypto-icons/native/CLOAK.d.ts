/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function CLOAK({ size, color }: Props): JSX.Element;
declare namespace CLOAK {
    var DefaultColor: string;
}
export default CLOAK;
