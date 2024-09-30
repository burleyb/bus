'use strict';

import sinon from 'sinon';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
proxyquire.noCallThru();

describe("Install bot", function() {
  let installBot;
  let addPermissionFunc;
  let getBucketNotificationConfigurationFunc;
  let listAttachedRolePoliciesFunc;
  let putBucketNotificationConfigurationFunc;
  let attachRolePolicyFunc;
  let sendCustomResourceResponseFunc;

  before(function () {
    process.env.Resources = "{ \"LeoFirehoseRole\": \"FOOBARD\" }";
    process.env.AWS = "{}";

    addPermissionFunc = sinon.stub();
    getBucketNotificationConfigurationFunc = sinon.stub();
    listAttachedRolePoliciesFunc = sinon.stub();
    putBucketNotificationConfigurationFunc = sinon.stub();
    attachRolePolicyFunc = sinon.stub();
    sendCustomResourceResponseFunc = sinon.stub();

    const leoSdk = {
      bot: {
        createBot: () => Promise.resolve()
      },
      configuration: {
        resources: {
          LeoFirehoseStreamProcessor: "foo"
        }
      },
      '@global': true
    };
    const AWS = {
      S3: class S3 {  
        constructor() {
          this.getBucketNotificationConfiguration = getBucketNotificationConfigurationFunc;
          this.putBucketNotificationConfiguration = putBucketNotificationConfigurationFunc;
        }  
      },
      IAM: class IAM {
        constructor() {
          this.listAttachedRolePolicies = listAttachedRolePoliciesFunc;
          this.attachRolePolicy = attachRolePolicyFunc;
        }  
      },
      Lambda: class Lambda {
        constructor() {
          this.addPermission = addPermissionFunc;
        }  
      },
      '@global': true
    };

    installBot = proxyquire('../', {
      'aws-sdk': AWS,
      'leo-sdk': leoSdk,
      '../../lib/sendCustomResourceResponse': sendCustomResourceResponseFunc
    });
  });

  after(function () {
    // Cleanup if needed
  });

  it("Succeeds", async function() {
    addPermissionFunc.yields();
    sendCustomResourceResponseFunc.resolves({
      Status: "SUCCESS"
    });

    getBucketNotificationConfigurationFunc.yields(null, {
      LambdaFunctionConfigurations: []
    });
    listAttachedRolePoliciesFunc.yields(null, {
      AttachedPolicies: []
    });
    putBucketNotificationConfigurationFunc.yields();
    attachRolePolicyFunc.yields(null, "attachrole result");

    const event = {
      ResponseURL: 'http://localhost',
      PhysicalResourceId: 'physicalresourceid',
      StackId: 'stackid',
      RequestId: 'requestid',
      LogicalResourceId: 'logicalresourceid',
      ResourceProperties: {}
    };

    const result = await new Promise((resolve, reject) => {
      installBot.handler(event, {}, (err, res) => {
        if (err) reject(err);
        else resolve(res);
      });
    });

    expect(result.Status).to.be.equal("SUCCESS");
  });
});
