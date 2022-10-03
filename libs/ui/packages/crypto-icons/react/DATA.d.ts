/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function DATA({ size, color }: Props): JSX.Element;
declare namespace DATA {
    var DefaultColor: string;
}
export default DATA;
