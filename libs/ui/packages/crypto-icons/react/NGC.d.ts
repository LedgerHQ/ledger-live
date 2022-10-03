/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function NGC({ size, color }: Props): JSX.Element;
declare namespace NGC {
    var DefaultColor: string;
}
export default NGC;
