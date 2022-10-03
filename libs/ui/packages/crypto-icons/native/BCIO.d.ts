/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function BCIO({ size, color }: Props): JSX.Element;
declare namespace BCIO {
    var DefaultColor: string;
}
export default BCIO;
