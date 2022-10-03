/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function DCR({ size, color }: Props): JSX.Element;
declare namespace DCR {
    var DefaultColor: string;
}
export default DCR;
