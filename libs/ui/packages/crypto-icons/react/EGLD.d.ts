/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function EGLD({ size, color }: Props): JSX.Element;
declare namespace EGLD {
    var DefaultColor: string;
}
export default EGLD;
