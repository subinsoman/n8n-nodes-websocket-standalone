import type { IDataObject, IExecuteFunctions, ILoadOptionsFunctions, IPollFunctions } from 'n8n-workflow';
import type { TDtableMetadataColumns, TDtableViewColumns } from './types';
import type { ICtx, IDtableMetadataColumn, IName, IRow, IRowObject } from './Interfaces';
export declare function resolveBaseUri(ctx: ICtx): string | undefined;
export declare function getBaseAccessToken(this: IExecuteFunctions | ILoadOptionsFunctions | IPollFunctions, ctx: ICtx): Promise<void>;
export declare function seaTableApiRequest(this: IExecuteFunctions | ILoadOptionsFunctions | IPollFunctions, ctx: ICtx, method: string, endpoint: string, body?: any, qs?: IDataObject, url?: string | undefined, option?: IDataObject): Promise<any>;
export declare function setableApiRequestAllItems(this: IExecuteFunctions | IPollFunctions, ctx: ICtx, propertyName: string, method: string, endpoint: string, body: IDataObject, query?: IDataObject): Promise<any>;
export declare function getTableColumns(this: ILoadOptionsFunctions | IExecuteFunctions | IPollFunctions, tableName: string, ctx?: ICtx): Promise<TDtableMetadataColumns>;
export declare function getTableViews(this: ILoadOptionsFunctions | IExecuteFunctions, tableName: string, ctx?: ICtx): Promise<TDtableViewColumns>;
export declare function simplify(data: {
    results: IRow[];
}, metadata: IDataObject): IDataObject[];
export declare function getColumns(data: {
    metadata: [{
        key: string;
        name: string;
    }];
}): {};
export declare function getDownloadableColumns(data: {
    metadata: [{
        key: string;
        name: string;
        type: string;
    }];
}): string[];
export declare const nameOfPredicate: (names: readonly IName[]) => (name: string) => IName | undefined;
export declare const split: (subject: string) => string[];
export declare function columnNamesToArray(columnNames: string): string[];
export declare function columnNamesGlob(columnNames: string[], dtableColumns: TDtableMetadataColumns): string[];
export declare function rowsSequence(rows: IRow[]): void;
export declare function rowDeleteInternalColumns(row: IRow): IRow;
export declare function rowFormatColumns(row: IRow, columnNames: string[]): IRow;
export declare function rowsFormatColumns(rows: IRow[], columnNames: string[]): void;
export declare function rowMapKeyToName(row: IRow, columns: TDtableMetadataColumns): IRow;
export declare function rowExport(row: IRowObject, columns: TDtableMetadataColumns): IRowObject;
export declare const dtableSchemaIsColumn: (column: IDtableMetadataColumn) => boolean;
export declare const dtableSchemaColumns: (columns: TDtableMetadataColumns) => TDtableMetadataColumns;
export declare const updateAble: (columns: TDtableMetadataColumns) => TDtableMetadataColumns;
