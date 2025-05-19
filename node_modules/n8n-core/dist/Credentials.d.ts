import type { CredentialInformation, ICredentialDataDecryptedObject, ICredentialsEncrypted } from 'n8n-workflow';
import { ICredentials } from 'n8n-workflow';
export declare class Credentials extends ICredentials {
    hasNodeAccess(nodeType: string): boolean;
    setData(data: ICredentialDataDecryptedObject, encryptionKey: string): void;
    setDataKey(key: string, data: CredentialInformation, encryptionKey: string): void;
    getData(encryptionKey: string, nodeType?: string): ICredentialDataDecryptedObject;
    getDataKey(key: string, encryptionKey: string, nodeType?: string): CredentialInformation;
    getDataToSave(): ICredentialsEncrypted;
}
