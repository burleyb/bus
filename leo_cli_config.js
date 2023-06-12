'use strict';

module.exports = {
	publish: [{
		leoaws: {
			profile: 'leo',
			region: 'us-east-1'
		},
		public: true
	}],
	deploy: {
		DEV: {
			stack: 'LeoDevV2-Bus',
			parameters: {
				TrustedAWSPrinciples: '',
				QueueReplicationDestinationLeoBotRoleARNs: '',
				QueueReplicationMapping: '[]'
			},
			region: 'us-east-1'
		},
		PROD: {
			stack: 'LeoProdV2-Bus-11Y73AXJQ91CA',
			parameters: {
				TrustedAWSPrinciples: '',
				QueueReplicationDestinationLeoBotRoleARNs: '',
				QueueReplicationMapping: '[]'
			},
			region: 'us-east-1'
		}
	}
};
