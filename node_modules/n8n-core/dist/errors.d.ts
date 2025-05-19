export declare class FileNotFoundError extends Error {
    readonly filePath: string;
    constructor(filePath: string);
}
