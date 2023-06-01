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
			stack: 'LeoPlatformV2-Bus-WJHM1F32629G',
			parameters: {
				TrustedAWSPrinciples: '',
				QueueReplicationDestinationLeoBotRoleARNs: '',
				QueueReplicationMapping: '[]'
			},
			region: 'us-east-1'
		},
		PROD: {
			stack: 'LeoProdV2-Bus-11Y73AXJQ91',
			parameters: {
				TrustedAWSPrinciples: '',
				QueueReplicationDestinationLeoBotRoleARNs: '',
				QueueReplicationMapping: '[]'
			},
			region: 'us-east-1'
		}
	}
};
