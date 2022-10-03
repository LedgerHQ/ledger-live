/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function RAP({ size, color }: Props): JSX.Element;
declare namespace RAP {
    var DefaultColor: string;
}
export default RAP;
