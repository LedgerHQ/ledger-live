/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function EGEM({ size, color }: Props): JSX.Element;
declare namespace EGEM {
    var DefaultColor: string;
}
export default EGEM;
