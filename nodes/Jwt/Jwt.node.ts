import { IExecuteFunctions } from 'n8n-core';
import {
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import { formatPrivateKey } from './utils';

var jwt = require('jsonwebtoken');

export class Jwt implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'JWT',
		name: 'jwt',
		icon: 'fa:fingerprint',
		group: ['transform'],
		version: 1,
		description: 'JWT',
		subtitle: '={{ $parameter["operation"] }}',
		defaults: {
			name: 'JWT',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				// eslint-disable-next-line n8n-nodes-base/node-class-description-credentials-name-unsuffixed
				name: 'jwtSecret',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Decode',
						value: 'decode',
						action: 'Decode a JWT',
					},
					{
						name: 'Sign',
						value: 'sign',
						action: 'Sign a JWT',
					},
					{
						name: 'Verify',
						value: 'verify',
						action: 'Verify a JWT',
					},
				],
				default: 'sign',
			},
			{
				displayName: 'Algorithm',
				name: 'algorithm',
				type: 'options',
				options: [
					{
						name: 'ES256',
						value: 'ES256',
					},
					{
						name: 'ES384',
						value: 'ES384',
					},
					{
						name: 'ES512',
						value: 'ES512',
					},
					{
						name: 'HS256',
						value: 'HS256',
					},
					{
						name: 'HS384',
						value: 'HS384',
					},
					{
						name: 'HS512',
						value: 'HS512',
					},
					{
						name: 'PS256',
						value: 'PS256',
					},
					{
						name: 'PS384',
						value: 'PS384',
					},
					{
						name: 'PS512',
						value: 'PS512',
					},
					{
						name: 'RS256',
						value: 'RS256',
					},
					{
						name: 'RS384',
						value: 'RS384',
					},
					{
						name: 'RS512',
						value: 'RS512',
					},
				],
				default: 'HS256',
				description: 'The algorithm to use for signing the token',
				displayOptions: {
					show: {
						operation: ['sign', 'verify'],
					},
				},
			},
			{
				displayName: 'Advanced Claim Builder',
				name: 'advancedClaimBuilder',
				type: 'boolean',
				default: false,
				// eslint-disable-next-line n8n-nodes-base/node-param-description-boolean-without-whether
				description: 'Allows to build the claims in a more advanced way',
				displayOptions: {
					show: {
						operation: ['sign'],
					},
				},
			},
			{
				displayName: 'Claims',
				name: 'claims',
				type: 'collection',
				placeholder: 'Add Claim',
				default: {},
				options: [
					{
						displayName: 'Audience',
						name: 'audience',
						type: 'string',
						default: '',
						description: 'Identifies the recipients that the JWT is intended for',
					},
					{
						displayName: 'Expires In',
						name: 'expiresIn',
						type: 'number',
						default: 3600,
						description: 'The lifetime of the token in seconds',
					},
					{
						displayName: 'Issuer',
						name: 'issuer',
						type: 'string',
						default: '',
						description: 'Identifies the principal that issued the JWT',
					},
					{
						displayName: 'JWT ID',
						name: 'jwtid',
						type: 'string',
						default: '',
						description: 'Unique identifier for the JWT',
					},
					{
						displayName: 'Not Before',
						name: 'notBefore',
						type: 'number',
						default: 0,
						description: 'The time before which the JWT must not be accepted for processing',
					},
					{
						displayName: 'Subject',
						name: 'subject',
						type: 'string',
						default: '',
						description: 'Identifies the principal that is the subject of the JWT',
					},
				],
				displayOptions: {
					show: {
						operation: ['sign'],
						"/advancedClaimBuilder": [false],
					},
				},
			},
			{
				displayName: 'Claims',
				name: 'claimsJson',
				type: 'json',
				default: '',
				description: 'Claims to add to the token in JSON format',
				displayOptions: {
					show: {
						operation: ['sign'],
						"/advancedClaimBuilder": [true],
					},
				},
			},
			{
				displayName: 'Token',
				name: 'token',
				type: 'string',
				default: '',
				description: 'The token to verify',
				displayOptions: {
					show: {
						operation: ['verify', 'decode'],
					},
				},
			},
			{
				displayName: 'Return Complete Token',
				name: 'complete',
				type: 'boolean',
				default: false,
				// eslint-disable-next-line n8n-nodes-base/node-param-description-boolean-without-whether
				description: 'If true the whole token will be returned',
				displayOptions: {
					show: {
						operation: ['verify', 'decode'],
					},
				},
			},
			{
				displayName: 'Ignore Expiration',
				name: 'ignoreExpiration',
				type: 'boolean',
				default: false,
				// eslint-disable-next-line n8n-nodes-base/node-param-description-boolean-without-whether
				description: 'If true do not validate the expiration of the token',
				displayOptions: {
					show: {
						operation: ['verify'],
					},
				},
			},
			{
				displayName: 'Ignore Not Before',
				name: 'ignoreNotBefore',
				type: 'boolean',
				default: false,
				// eslint-disable-next-line n8n-nodes-base/node-param-description-boolean-without-whether
				description: 'If true do not validate the not before of the token',
				displayOptions: {
					show: {
						operation: ['verify'],
					},
				},
			},
			{
				displayName: 'Clock Tolerance',
				name: 'clockTolerance',
				type: 'number',
				default: 0,
				description: 'Number of seconds to tolerate when checking the nbf and exp claims, to deal with small clock differences among different servers',
				displayOptions: {
					show: {
						operation: ['verify'],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0);
		const credentials = await this.getCredentials('jwtSecret');
		let key = "";

		if (credentials.keyType === 'publicKey') {
			key = formatPrivateKey(credentials.publicKey as string);
		}

		if (credentials.keyType === 'privateKey') {
			key = formatPrivateKey(credentials.privateKey as string);
		}

		if (credentials.keyType === 'passphrase') {
			key = credentials.secret as string;
		}

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				if (operation === 'sign') {
					const algorithm = this.getNodeParameter('algorithm', itemIndex);
					const advancedClaimBuilder = this.getNodeParameter('advancedClaimBuilder', itemIndex) as boolean;
					let claimsToSign = {};
					if (advancedClaimBuilder) {
						claimsToSign = this.getNodeParameter('claimsJson', itemIndex) as IDataObject;
					} else {
						claimsToSign = this.getNodeParameter('claims', itemIndex) as IDataObject;
					}
					let token = "";
					if (credentials.keyType === 'passphrase') {
						token = jwt.sign(claimsToSign, key, { algorithm });
					} else {
						if (credentials.passphrase) {
							token = jwt.sign(claimsToSign, {key: key, passphrase: credentials.passphrase}, { algorithm });
						} else {
							token = jwt.sign(claimsToSign, key, { algorithm });
						}
					}

					returnData.push({
						json: {
							token: token,
						},
						pairedItem: itemIndex,
					});
				}

				if (operation === 'verify') {
					const algorithm = this.getNodeParameter('algorithm', itemIndex);
					const token = this.getNodeParameter('token', itemIndex) as string;
					const complete = this.getNodeParameter('complete', itemIndex) as boolean;
					const ignoreExpiration = this.getNodeParameter('ignoreExpiration', itemIndex) as boolean;
					const ignoreNotBefore = this.getNodeParameter('ignoreNotBefore', itemIndex) as boolean;
					const clockTolerance = this.getNodeParameter('clockTolerance', itemIndex) as number;
					const decoded = jwt.verify(token, key, {
						algorithms: algorithm,
						ignoreExpiration,
						ignoreNotBefore,
						clockTolerance,
						complete,
					});
					returnData.push({
						json: decoded,
						pairedItem: itemIndex,
					});
				}

				if (operation === 'decode') {
					const token = this.getNodeParameter('token', itemIndex) as string;
					const complete = this.getNodeParameter('complete', itemIndex) as boolean;
					const decoded = jwt.decode(token, { complete });
					returnData.push({
						json: decoded,
						pairedItem: itemIndex,
					});
				}

			} catch (error) {
				if (this.continueOnFail()) {
					items.push({ json: this.getInputData(itemIndex)[0].json, error, pairedItem: itemIndex });
				} else {
					if (error.context) {
						error.context.itemIndex = itemIndex;
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error, {
						itemIndex,
					});
				}
			}
		}

		return this.prepareOutputData(returnData);
	}
}
