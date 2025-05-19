import type { INode, INodeType, NodeParameterValueType } from 'n8n-workflow';
export declare function extractValue(value: NodeParameterValueType | object, parameterName: string, node: INode, nodeType: INodeType): NodeParameterValueType | object;
