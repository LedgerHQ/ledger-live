/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function LINK({ size, color }: Props): JSX.Element;
declare namespace LINK {
    var DefaultColor: string;
}
export default LINK;
