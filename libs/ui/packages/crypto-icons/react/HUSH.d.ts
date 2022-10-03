/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function HUSH({ size, color }: Props): JSX.Element;
declare namespace HUSH {
    var DefaultColor: string;
}
export default HUSH;
