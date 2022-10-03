/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function SAFE({ size, color }: Props): JSX.Element;
declare namespace SAFE {
    var DefaultColor: string;
}
export default SAFE;
