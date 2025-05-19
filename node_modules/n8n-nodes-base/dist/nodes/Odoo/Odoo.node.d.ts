import type { IExecuteFunctions, ICredentialsDecrypted, ICredentialTestFunctions, ILoadOptionsFunctions, INodeCredentialTestResult, INodeExecutionData, INodePropertyOptions, INodeType, INodeTypeDescription } from 'n8n-workflow';
export declare class Odoo implements INodeType {
    description: INodeTypeDescription;
    methods: {
        loadOptions: {
            getModelFields(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
            getModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
            getStates(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
            getCountries(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
        };
        credentialTest: {
            odooApiTest(this: ICredentialTestFunctions, credential: ICredentialsDecrypted): Promise<INodeCredentialTestResult>;
        };
    };
    execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
}
