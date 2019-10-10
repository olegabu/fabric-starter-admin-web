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

  templates= {
    tasks: {
      startRaftOrderingService3Nodes: {
        name: 'Start RAFT Cluster with 3 Nodes',
        params: {
          ordererNames: 'raft1,raft2,raft3',
          ordererDomain: "${ORDERER_DOMAIN}",
          configtxTemplate: '3-raft-node-template.yaml'
        }
      },
      prepareRaft1Node: {
        name: 'Prepare one RAFT server',
        params: {
          ordererName: "${ORDERER_NAME}",
          ordererDomain: "${ORDERER_DOMAIN}",
          configtxTemplate: 'raft-node-template.yaml'
        }
      },
      startRaft1Node: {
        name: 'Start one RAFT server',
        params: {
          ordererName: "${ORDERER_NAME}", ordererDomain: "${ORDERER_DOMAIN}", configtxTemplate: 'raft-node-template.yaml'
        }
      },
      addOrdererToRaftOrderingService: {
        name: 'Add Orderer to RAFT Ordering Service configuration',
        params: {
          ordererName: "${ORDERER_NAME}", ordererDomain: "${ORDERER_DOMAIN}",
          ordererPort: "${ORDERER_GENERAL_LISTENPORT}",
          wwwAddress: "${ORDERER_WWW_AADDRESS}"
        }
      },
      passTaskToOtherParty: {
        name: 'Pass task to Other Party',
        params: {targetOrgAddress: "${OTHER_PARTY_ADDRESS}"}
      },
      waitForOtherPartyOnEntrypoint: {
        name: 'Wait for other party complete and invoke entrypoint',
        params: {entryPointCallback: "${MY_WAIT_ENTRYPOINT}?scenario=${SCENARIO}&step=${step}"}
      },
      waitForOtherPartyOnChaincode: {
        name: 'Wait for other party complete and invoke chaincode',
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
    },


    scenarios : {
      startRaftCluster: {
        name: "Start new RAFT ordering service",
        params:[{name: 'ORDERER_NAMES', value:'raft0,raft1,raft2'}, {name: 'ORDERER_DOMAIN', value:'osn-${ORG}.${DOMAIN}'}, {name:'ORDERER_PORTS', value:'7050,7150,7250'}],
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
      },
      inviteOrdererToRAFTCluster: {
        name: 'Invite orderer to RAFT ordering service',
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

      addToConsortium: {
        name: "Add Org To Consortium with policy ANY",
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
    }
  };


  constructor(identityService, eventAggregator, chaincodeService, configService, alertService, consortiumService, webAppService, dialogService) {
    this.dialogService = dialogService;
  }

  attached() {
    this.createScenario();
  }

  createScenario() {
    this.dialogService.open({viewModel: EditScenario, model: this.templates, lock: true}).whenClosed(response => {
      if (!response.wasCancelled) {
        console.log(this.osn);
      } else {
        console.log('cancelled');
      }
    });
  }
}

