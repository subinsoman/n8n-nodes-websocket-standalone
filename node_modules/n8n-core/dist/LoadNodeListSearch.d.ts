import type { INodeListSearchResult, IWorkflowExecuteAdditionalData } from 'n8n-workflow';
import { LoadNodeDetails } from './LoadNodeDetails';
export declare class LoadNodeListSearch extends LoadNodeDetails {
    getOptionsViaMethodName(methodName: string, additionalData: IWorkflowExecuteAdditionalData, filter?: string, paginationToken?: string): Promise<INodeListSearchResult>;
}
