import type { IExecuteFunctions, ILoadOptionsFunctions, INodeExecutionData, INodePropertyOptions, INodeType, INodeTypeDescription } from 'n8n-workflow';
export declare class Salesforce implements INodeType {
    description: INodeTypeDescription;
    methods: {
        loadOptions: {
            getLeadStatuses(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
            getUsers(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
            getCaseOwners(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
            getLeadOwners(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
            getLeadSources(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
            getCustomFields(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
            getRecordTypes(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
            getExternalIdFields(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
            getAccounts(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
            getCampaigns(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
            getStages(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
            getAccountTypes(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
            getAccountSources(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
            getCaseTypes(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
            getCaseStatuses(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
            getCaseReasons(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
            getCaseOrigins(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
            getCasePriorities(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
            getTaskStatuses(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
            getTaskTypes(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
            getTaskSubjects(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
            getTaskCallTypes(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
            getTaskPriorities(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
            getTaskRecurrenceTypes(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
            getTaskRecurrenceInstances(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
            getCustomObjects(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
            getCustomObjectFields(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
            getAccountFields(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
            getAtachmentFields(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
            getCaseFields(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
            getLeadFields(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
            getOpportunityFields(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
            getTaskFields(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
            getUserFields(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
            getContactFields(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
        };
    };
    execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
}
