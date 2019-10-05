import {inject} from "aurelia-dependency-injection";
import {DialogService} from 'aurelia-dialog';
import {IdentityService} from "../../services/identity-service";
import {EventAggregator} from "aurelia-event-aggregator";
import {ChaincodeService} from "../../services/chaincode-service";
import {ConfigService} from "../../services/config-service";
import {AlertService} from "../../services/alert-service";
import {ConsortiumService} from "../../services/consortium-service";
import {WebAppService} from "../../services/webapp-service";
import {EditScenario} from "./edit-scenario";

@inject(IdentityService, EventAggregator, ChaincodeService, ConfigService, AlertService, ConsortiumService, WebAppService, DialogService)
export class DeploymentScenario {

  osn = {};

  tasks = {
    startRaftOrderingService3Nodes: {
      name: 'Start RAFT Cluster with 3 Nodes',
      params: {
        ordererNames: 'raft1,raft2,raft3',
        ordererDomain: "${ORDERER_DOMAIN}",
        configtxTemplate: '3-raft-node-template.yaml'
      }
    },
    prepareRaft1Node: {
      name: 'Prepare Own RAFT server',
      params: {
        ordererName: "${ORDERER_NAME}",
        ordererDomain: "${ORDERER_DOMAIN}",
        configtxTemplate: 'raft-node-template.yaml'
      }
    },
    startRaft1Node: {
      name: 'Start Own RAFT server',
      params: {
        ordererName: "${ORDERER_NAME}", ordererDomain: "${ORDERER_DOMAIN}", configtxTemplate: 'raft-node-template.yaml'
      }
    },
    addOrdererToRaftOrderingService: {
      name: 'Add new Orderer to RAFT Ordering Service configuration',
      params: {
        ordererName: "${ORDERER_NAME}", ordererDomain: "${ORDERER_DOMAIN}",
        ORDERER_GENERAL_LISTENPORT: "${ORDERER_GENERAL_LISTENPORT}",
        wwwAddress: "${ORDERER_WWW_AADDRESS}"
      }
    },
    passTaskToOtherParty: {
      name: 'Pass control to Other Party',
      params: {address: "${OTHER_PARTY_ADDRESS}", task: "${TASK}", params: {senderScenario: '', scenarioStep: ''}}
    },
    waitForOtherPartyOnEntrypoint: {
      name: 'Wait other party complete and invoke entrypoint',
      params: {entryPointCallback: "${MY_WAIT_ENTRYPOINT}?scenario=${SCENARIO}&step=${step}"}
    },
    waitForOtherPartyOnChaincode: {
      name: 'Wait other party complete and invoke chaincode',
      params: {channel: "common", chaincode: "serviceChaincode"}
    },
    inviteOrgToConsortium: {
      name: 'Invite Org to Consortium',
      params: {org: {mspId: "${ORG}", peer0Port: '${PEER0_PORT}', wwwPort: "${wwwPort}"}}
    },
    createChannel: {
      name: 'Create Channel',
      params: {channel: "${CHANNEL}"}
    },
    addOrgToChannel: {
      name: 'Add Org To Channel',
      params: {channel: "${CHANNEL}", org: {mspId: "${ORG}", peer0Port: '${PEER0_PORT}', wwwPort: "${wwwPort}"}}
    },
    joinChannel: {
      name: 'Join Channel',
      params: {channel: "common"}
    },
  };


  scenarios = {
    addToConsortium: {
      name: "Add Org To Consortium with policy: ANY",
      steps: [{
        task: 'inviteOrgToConsortium',
        params: {mspId: "${NEWORG}"},
        auto: true,
      }]
    },

    joinChannel: {
      name: "Join existing channel",
      params: ['CHANNEL_OWNER_ADDRESS', 'CHANNEL', 'NEWORG', 'PEER0_PORT', 'WWW_PORT'],
      steps: [
        {
          task: 'passTaskToOtherParty',
          params: {
            task: "addOrgToChannel",
            params: {address: "${CHANNEL_OWNER_ADDRESS}", channel: "${CHANNEL}", org: {mspId: "${NEWORG}"}}
          },
          auto: true,
        },
        {
          task: 'waitForOtherPartyOnEntrypoint',
          params: {
            entryPointCallback: "${MY_IP}",
          },
          auto: true,
        },
        {
          task: 'joinChannel',
          params: {
            channel: "${CHANNEL}",
          },
          auto: true,
        },
      ]
    },

    joinRaftOrderingService: {
      name: 'Join existing RAFT ordering service',
      params: ['ORDERER_NAME', 'ORDERER_DOMAIN', 'ORDERER_GENERAL_LISTENPORT', 'WWW_PORT'],
      steps: [
        {
          task: "prepareRaft1Node",
          params: {ordererName: "${ORDERER_NAME}", ordererDomain: "${ORDERER_DOMAIN}"}
        },
        {
          task: 'passTaskToOtherParty',
          params: {task: "addOrdererToRaftOrderingService",},
          auto: true,
        },
        {
          task: "startRaft1Node",
          params: {ordererName: "${ORDERER_NAME}", ordererDomain: "${ORDERER_DOMAIN}"}
        }
      ]
    },

    inviteOrdererToRAFTCluster: {
      name: 'Invite new orderer to existing RAFT ordering service',
      steps: [
        {
          task: 'passTaskToOtherParty',
          params: {task: "prepareRaft1Node"},
          auto: true,
        },
        {
          task: 'addOrdererToRaftOrderingService',
        },
        {
          task: 'passTaskToOtherParty',
          params: {task: "startRaft1Node"},
          auto: true,
        },
      ]
    },

    startRaftCluster: {
      name: "Start new RAFT ordering service",
      steps: [
        {
          step: "1",
          task: 'startRaftOrderingService3Nodes',
          auto: true,
        },
        {
          step: "2",
          scenario: 'inviteOrdererToRAFTCluster',
          auto: true,
        },
      ]
    }
  };


  constructor(identityService, eventAggregator, chaincodeService, configService, alertService, consortiumService, webAppService, dialogService) {
    this.dialogService = dialogService;
  }

  createScenario() {
    this.dialogService.open({viewModel: EditScenario, model: this.scenario, lock: false}).whenClosed(response => {
      if (!response.wasCancelled) {
        console.log(this.osn);
      } else {
        console.log('cancelled');
      }
    });
  }
}

