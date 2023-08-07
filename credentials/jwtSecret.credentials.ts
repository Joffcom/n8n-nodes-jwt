import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

// eslint-disable-next-line n8n-nodes-base/cred-class-name-unsuffixed
export class jwtSecret implements ICredentialType {
	// eslint-disable-next-line n8n-nodes-base/cred-class-field-name-unsuffixed
	name = 'jwtSecret';
	// eslint-disable-next-line n8n-nodes-base/cred-class-field-display-name-missing-api
	displayName = 'JWT Secret';
	properties: INodeProperties[] = [
		{
			displayName: 'Key Type',
			name: 'keyType',
			type: 'options',
			options: [
				{
					name: 'Passphrase',
					value: 'passphrase',
				},
				{
					name: 'Private Key',
					value: 'privateKey',
				},
				{
					name: 'Public Key',
					value: 'publicKey',
				},
			],
			default: 'passphrase',
		},
		{
			displayName: 'Private Key',
			name: 'privateKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			displayOptions: {
				show: {
					keyType: [
						'privateKey',
					],
				},
			},
			default: '',
		},
		{
			displayName: 'Public Key',
			name: 'publicKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			displayOptions: {
				show: {
					keyType: [
						'publicKey',
					],
				},
			},
			default: '',
		},
		{
			displayName: 'Passphrase',
			name: 'passphrase',
			type: 'string',
			typeOptions: {
				password: true,
			},
			displayOptions: {
				show: {
					keyType: [
						'privateKey',
					],
				},
			},
			default: '',
		},
		{
			displayName: 'Secret',
			name: 'secret',
			type: 'string',
			typeOptions: {
				password: true,
			},
			displayOptions: {
				show: {
					keyType: [
						'passphrase',
					],
				},
			},
			default: '',
		},
	];
}
