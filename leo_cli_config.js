'use strict';

module.exports = {
	publish: [{
		leoaws: {
			profile: 'stealthoms',
			region: 'us-east-1'
		},
		public: true
	}],
	deploy: {
		DEV: {
			stack: 'RstreamsDEV',
			parameters: {
				TrustedAWSPrinciples: '',
				QueueReplicationDestinationLeoBotRoleARNs: '',
				QueueReplicationMapping: '[]',
				CronProcessorMemory: 256,
				Environment: "DEV",
				EventTriggerMemory: 128,
				FirehoseStreamProcessorMemory: 640,
				KinesisShards: 1,
				KinesisStreamProcessorMemory: 640,
				LambdaInvokePolicy: '',
				LeoArchiveBillingMode: 'PAY_PER_REQUEST',
				LeoCronBillingMode: 'PAY_PER_REQUEST',
				LeoEventBillingMode: 'PAY_PER_REQUEST',
				LeoMonitorMemory: 256,
				LeoSettingsBillingMode: 'PAY_PER_REQUEST',
				LeoStreamBillingMode: 'PAY_PER_REQUEST',
				LeoSystemBillingMode: 'PAY_PER_REQUEST',
				MonitorShardHashKey: 0,
				StreamTTLSeconds: 604800
			},
			region: 'us-east-1'
		},
		PROD: {
			stack: 'RstreamsPROD',
			parameters: {
				TrustedAWSPrinciples: '',
				QueueReplicationDestinationLeoBotRoleARNs: '',
				QueueReplicationMapping: '[]',
				CronProcessorMemory: 256,
				Environment: "PROD",
				EventTriggerMemory: 128,
				FirehoseStreamProcessorMemory: 640,
				KinesisShards: 1,
				KinesisStreamProcessorMemory: 640,
				LambdaInvokePolicy: '',
				LeoArchiveBillingMode: 'PAY_PER_REQUEST',
				LeoCronBillingMode: 'PAY_PER_REQUEST',
				LeoEventBillingMode: 'PAY_PER_REQUEST',
				LeoMonitorMemory: 256,
				LeoSettingsBillingMode: 'PAY_PER_REQUEST',
				LeoStreamBillingMode: 'PAY_PER_REQUEST',
				LeoSystemBillingMode: 'PAY_PER_REQUEST',
				MonitorShardHashKey: 0,
				StreamTTLSeconds: 604800
			},
			region: 'us-east-1'
		}
	}
};
