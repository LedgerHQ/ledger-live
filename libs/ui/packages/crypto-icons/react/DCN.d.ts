/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function DCN({ size, color }: Props): JSX.Element;
declare namespace DCN {
    var DefaultColor: string;
}
export default DCN;
