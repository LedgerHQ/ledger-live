/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function WABI({ size, color }: Props): JSX.Element;
declare namespace WABI {
    var DefaultColor: string;
}
export default WABI;
