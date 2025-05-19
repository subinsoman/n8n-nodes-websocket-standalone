import type { ILoadOptions, INodePropertyOptions, IWorkflowExecuteAdditionalData } from 'n8n-workflow';
import { LoadNodeDetails } from './LoadNodeDetails';
export declare class LoadNodeParameterOptions extends LoadNodeDetails {
    getOptionsViaMethodName(methodName: string, additionalData: IWorkflowExecuteAdditionalData): Promise<INodePropertyOptions[]>;
    getOptionsViaRequestProperty(loadOptions: ILoadOptions, additionalData: IWorkflowExecuteAdditionalData): Promise<INodePropertyOptions[]>;
}
