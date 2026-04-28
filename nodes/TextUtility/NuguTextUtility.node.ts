import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

const NodeConnectionTypes = {
	Main: 'main',
} as const;

class NodeOperationError extends Error {
	constructor(_node: unknown, error: Error | string, options?: { itemIndex?: number }) {
		super(error instanceof Error ? error.message : error);
		this.name = 'NodeOperationError';
		if (error instanceof Error && error.stack) {
			this.stack = error.stack;
		}
		if (options?.itemIndex !== undefined) {
			this.message = `${this.message} [item ${options.itemIndex}]`;
		}
	}
}

const textOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['text'],
			},
		},
		options: [
			{
				name: 'Clean Text',
				value: 'clean',
				description: 'Normalize whitespace and optionally trim text',
				action: 'Clean text',
			},
			{
				name: 'Extract JSON',
				value: 'extractJson',
				description: 'Extract and parse a JSON object or array embedded in text',
				action: 'Extract JSON from text',
			},
		],
		default: 'clean',
	},
];

const textFields: INodeProperties[] = [
	{
		displayName: 'Text',
		name: 'text',
		type: 'string',
		typeOptions: {
			rows: 5,
		},
		required: true,
		default: '={{ $json.text }}',
		description: 'The text to process',
		displayOptions: {
			show: {
				resource: ['text'],
				operation: ['clean', 'extractJson'],
			},
		},
	},
	{
		displayName: 'Collapse Whitespace',
		name: 'collapseWhitespace',
		type: 'boolean',
		default: true,
		description: 'Whether to replace consecutive whitespace with a single space',
		displayOptions: {
			show: {
				resource: ['text'],
				operation: ['clean'],
			},
		},
	},
	{
		displayName: 'Trim',
		name: 'trim',
		type: 'boolean',
		default: true,
		description: 'Whether to trim leading and trailing whitespace',
		displayOptions: {
			show: {
				resource: ['text'],
				operation: ['clean'],
			},
		},
	},
	{
		displayName: 'Output Field',
		name: 'outputField',
		type: 'string',
		default: 'text',
		required: true,
		description: 'Name of the field that receives the processed text',
		displayOptions: {
			show: {
				resource: ['text'],
				operation: ['clean'],
			},
		},
	},
	{
		displayName: 'Strip Markdown Code Fence',
		name: 'stripCodeFence',
		type: 'boolean',
		default: true,
		description:
			'Whether to remove surrounding Markdown code fences like ```JSON before parsing',
		displayOptions: {
			show: {
				resource: ['text'],
				operation: ['extractJson'],
			},
		},
	},
	{
		displayName: 'Output Mode',
		name: 'outputMode',
		type: 'options',
		options: [
			{
				name: 'Merge With Input Item',
				value: 'merge',
			},
			{
				name: 'Replace Input Item',
				value: 'replace',
			},
			{
				name: 'Put Parsed JSON In Field',
				value: 'field',
			},
		],
		default: 'merge',
		description: 'How to output the parsed JSON',
		displayOptions: {
			show: {
				resource: ['text'],
				operation: ['extractJson'],
			},
		},
	},
	{
		displayName: 'Output Field',
		name: 'jsonOutputField',
		type: 'string',
		default: 'parsedJson',
		required: true,
		description: 'Name of the field that receives the parsed JSON',
		displayOptions: {
			show: {
				resource: ['text'],
				operation: ['extractJson'],
				outputMode: ['field'],
			},
		},
	},
];

function cleanText(text: string, collapseWhitespace: boolean, trim: boolean) {
	let cleaned = text.replace(/\r\n/g, '\n');

	if (collapseWhitespace) {
		cleaned = cleaned.replace(/\s+/g, ' ');
	}

	if (trim) {
		cleaned = cleaned.trim();
	}

	return cleaned;
}

function stripMarkdownCodeFence(text: string) {
	const trimmed = text.trim();
	const match = trimmed.match(/^```(?:json|javascript|js)?\s*([\s\S]*?)\s*```$/i);

	return match?.[1] ?? trimmed;
}

function findJsonCandidate(this: IExecuteFunctions, text: string, itemIndex: number) {
	const trimmed = text.trim();
	const objectStart = trimmed.indexOf('{');
	const arrayStart = trimmed.indexOf('[');
	const starts = [objectStart, arrayStart].filter((index) => index >= 0);

	if (starts.length === 0) {
		throw new NodeOperationError(this.getNode(), 'No JSON object or array found in text', {
			itemIndex,
		});
	}

	const start = Math.min(...starts);
	const openChar = trimmed[start];
	const closeChar = openChar === '{' ? '}' : ']';
	const end = trimmed.lastIndexOf(closeChar);

	if (end <= start) {
		throw new NodeOperationError(this.getNode(), 'Could not find matching JSON closing delimiter', {
			itemIndex,
		});
	}

	return trimmed.slice(start, end + 1);
}

export class TextUtility implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Nugu Text Utility',
		name: 'nuguTextUtility',
		icon: { light: 'file:textUtility.svg', dark: 'file:textUtility.dark.svg' },
		group: ['transform'],
		version: [1],
		description: 'Small text helpers for in-house n8n workflows',
		defaults: {
			name: 'Nugu Text Utility',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Text',
						value: 'text',
					},
				],
				default: 'text',
			},
			...textOperations,
			...textFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const operation = this.getNodeParameter('operation', itemIndex) as string;
				const text = this.getNodeParameter('text', itemIndex) as string;
				const inputJson = { ...items[itemIndex].json };

				if (operation === 'clean') {
					const collapseWhitespace = this.getNodeParameter(
						'collapseWhitespace',
						itemIndex,
					) as boolean;
					const trim = this.getNodeParameter('trim', itemIndex) as boolean;
					const outputField = this.getNodeParameter('outputField', itemIndex) as string;

					returnData.push({
						json: {
							...inputJson,
							[outputField]: cleanText(text, collapseWhitespace, trim),
						},
						pairedItem: { item: itemIndex },
					});
					continue;
				}

				if (operation === 'extractJson') {
					const stripCodeFence = this.getNodeParameter('stripCodeFence', itemIndex) as boolean;
					const outputMode = this.getNodeParameter('outputMode', itemIndex) as string;
					const candidate = findJsonCandidate.call(
						this,
						stripCodeFence ? stripMarkdownCodeFence(text) : text,
						itemIndex,
					);
					const parsed = JSON.parse(candidate);

					if (outputMode === 'replace') {
						returnData.push({
							json: parsed,
							pairedItem: { item: itemIndex },
						});
						continue;
					}

					if (outputMode === 'field') {
						const jsonOutputField = this.getNodeParameter('jsonOutputField', itemIndex) as string;

						returnData.push({
							json: {
								...inputJson,
								[jsonOutputField]: parsed,
							},
							pairedItem: { item: itemIndex },
						});
						continue;
					}

					returnData.push({
						json: {
							...inputJson,
							...parsed,
						},
						pairedItem: { item: itemIndex },
					});
					continue;
				}

				throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, {
					itemIndex,
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error instanceof Error ? error.message : String(error),
						},
						pairedItem: { item: itemIndex },
					});
					continue;
				}

				throw new NodeOperationError(this.getNode(), error, { itemIndex });
			}
		}

		return [returnData];
	}
}
