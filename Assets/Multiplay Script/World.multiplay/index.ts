// import { Sandbox, SandboxOptions, SandboxPlayer } from "ZEPETO.Multiplay";
// import { DataStorage } from "ZEPETO.Multiplay.DataStorage";
// import {Action, Player, Transform, Vector3} from "ZEPETO.Multiplay.Schema";

// export default class extends Sandbox {

//     onCreate(options: SandboxOptions) {
//         this.onMessage("onChangedTransform", (client, message)=>{
//             const player = this.state.players.get(client.sessionId);

//             const transform = new Transform();
//             transform.position = new Vector3();
//             transform.position.x = message.position.x;
//             transform.position.y = message.position.y;
//             transform.position.z = message.position.z;
            
//             transform.rotation = new Vector3();
//             transform.rotation.x = message.rotation.x;
//             transform.rotation.y = message.rotation.y;
//             transform.rotation.z = message.rotation.z;
            

//             player.transform = transform;

//             //console.log(`[onChangedTransform] ${client.sessionId}'s pos x : ${transform.position.x}`);
//         });

//         this.onMessage("onChangeState", (client, message)=>{
//             const player = this.state.players.get(client.sessionId);
//             player.state = message.state;

//             //console.log(`[onChangeState] ${client.sessionId}'s pos x : ${message.state}`);
//         });

//         this.onMessage("onJump", (client) => {
//             const action = this.state.actions.get(client.sessionId);
//             action.jumpTrigger = !action.jumpTrigger;
//         });
//     }

//     async onJoin(client: SandboxPlayer) {
//         console.log(`[onJoin] sessionId: ${client.sessionId}, HashCode: ${client.hashCode}, userId: ${client.userId}`);

//         // s: add Player Map
//         const player = new Player();
//         player.sessionId = client.sessionId;
//         player.zepetoHash = client.hashCode || '';
//         player.zepetoUserId = client.userId || '';
//         this.state.players.set(client.sessionId, player);
//         // e: add Player Map

//         // s: add Action Map
//         const action = new Action();
//         action.jumpTrigger = false;
//         this.state.actions.set(client.sessionId, action);
//         // e: add Action Map


//         const storage: DataStorage = client.loadDataStorage();

//         let visit_cnt = await storage.get("VisitCount") as number;
//         if(visit_cnt == null) visit_cnt = 0;

//         console.log(`[onJoin] ${player.sessionId}'s visiting count: ${visit_cnt}`);

//         await storage.set("VisitCount", ++visit_cnt);
//     }

//     onLeave(client: SandboxPlayer, consented?: boolean) {
//         this.state.players.delete(client.sessionId);
//         this.state.players.delete(client.sessionId);
//     }
// }

import {Sandbox, SandboxOptions, SandboxPlayer} from "ZEPETO.Multiplay";
import {DataStorage} from "ZEPETO.Multiplay.DataStorage";
import {Gesture, LandingPoint, Player, SelfieIK, Transform, Trigger, Vector3} from "ZEPETO.Multiplay.Schema";

export default class extends Sandbox {


    storageMap:Map<string,DataStorage> = new Map<string, DataStorage>();
    
    constructor() {
        super();
    }

    onCreate(options: SandboxOptions) {

        // Room 객체가 생성될 때 호출됩니다.
        // Room 객체의 상태나 데이터 초기화를 처리 한다.

        this.onMessage("onChangedTransform", (client, message) => {
            const player = this.state.players.get(client.sessionId);

            const transform = new Transform();
            transform.position = new Vector3();
            transform.position.x = message.position.x;
            transform.position.y = message.position.y;
            transform.position.z = message.position.z;

            transform.rotation = new Vector3();
            transform.rotation.x = message.rotation.x;
            transform.rotation.y = message.rotation.y;
            transform.rotation.z = message.rotation.z;

            player.transform = transform;

            //player.expectedState = message.expectedState;
        });

        this.onMessage("onChangedState", (client, message) => {
            const player = this.state.players.get(client.sessionId);
            player.state = message.state;
            player.subState = message.subState; // Character Controller V2
        });

        this.onMessage("onPlayerJump", (client, message)=> {
            const trigger = this.state.jumpTriggers.get(client.sessionId);
            trigger.trigger = !trigger.trigger;
            console.log(`[onPlayerJump] ${client.sessionId} jump!`);
        });

        this.onMessage("onPlayerLanding", (client, message) => {
            const ladingPoint = this.state.landingPoints.get(client.sessionId);

            const transform = new Transform();
            transform.position = new Vector3();
            transform.position.x = message.position.x;
            transform.position.y = message.position.y;
            transform.position.z = message.position.z;

            transform.rotation = new Vector3();
            transform.rotation.x = message.rotation.x;
            transform.rotation.y = message.rotation.y;
            transform.rotation.z = message.rotation.z;

            ladingPoint.transform = transform;
        });

        this.onMessage("onSelfieIK", (client, message)=>{

            const selfieIK = this.state.selfieIKs.get(client.sessionId);
            const player = this.state.players.get(client.sessionId);

            const lookAt = new Vector3();
            lookAt.x = message.lookAt.x;
            lookAt.y = message.lookAt.y;
            lookAt.z = message.lookAt.z;
            selfieIK.lookAt = lookAt;

            const targetAt = new Vector3();
            targetAt.x = message.targetAt.x;
            targetAt.y = message.targetAt.y;
            targetAt.z = message.targetAt.z;
            selfieIK.targetAt = targetAt;

            selfieIK.isSelfie = message.isSelfie;
            player.isSelfieIK = selfieIK.isSelfie;

        });

        this.onMessage("onSelfieIKExit", (client, message)=>{

            const selfieIK = this.state.selfieIKs.get(client.sessionId);
            const player = this.state.players.get(client.sessionId);

            selfieIK.isSelfie = message.isSelfie;
            player.isSelfieIK = selfieIK.isSelfie;
        });

        this.onMessage("onGesture", (client, message) => {
            const gesture = this.state.gestures.get(client.sessionId);
            gesture.clipIndex = message.clipIndex;
        });

        this.onMessage("onSelfieWith", (client, message) => {
            const selfieIK = this.state.selfieIKs.get(client.sessionId);
            if(message.isActive && message.selfieSession) {
                selfieIK.selfieSession = message.selfieSession;
            } else {
                selfieIK.selfieSession = '';
            }
        });

    }
    
   
    
    async onJoin(client: SandboxPlayer) {

        // schemas.json 에서 정의한 player 객체를 생성 후 초기값 설정.
        console.log(`[OnJoin] sessionId : ${client.sessionId}, HashCode : ${client.hashCode}, userId : ${client.userId}`)

        /* player Map------------------*/
        const player = new Player();
        player.sessionId = client.sessionId;
        if (client.hashCode) {
            player.zepetoHash = client.hashCode;
        }
        if (client.userId) {
            player.zepetoUserId = client.userId;
        }
        player.isSelfieIK = false;
        // client 객체의 고유 키값인 sessionId 를 사용해서 Player 객체를 관리.
        // set 으로 추가된 player 객체에 대한 정보를 클라이언트에서는 players 객체에 add_OnAdd 이벤트를 추가하여 확인 할 수 있음.
        this.state.players.set(client.sessionId, player);
        /* player Map------------------*/

        /* jumpTrigger Map------------------*/
        const trigger = new Trigger();
        trigger.trigger = false;
        this.state.jumpTriggers.set(client.sessionId, trigger);
        /* jumpTrigger Map------------------*/

        /* landingPoints Map------------------*/
        this.state.landingPoints.set(client.sessionId, new LandingPoint());
        /* landingPoints Map------------------*/

        /* selfieIKs Map------------------*/
        const selfieIK = new SelfieIK();
        selfieIK.selfieSession = '';
        this.state.selfieIKs.set(client.sessionId, selfieIK);
        /* selfieIKs Map------------------*/ 
        
        /* gestures Map----------------------*/
        const gesture = new Gesture();
        gesture.clipIndex = -1;
        this.state.gestures.set(client.sessionId, gesture);
        /* gestures Map----------------------*/

        // [DataStorage] 입장한 Player의 DataStorage Load
        const storage: DataStorage = client.loadDataStorage();

        this.storageMap.set(client.sessionId,storage);

        let visit_cnt = await storage.get("VisitCount") as number;
        if (visit_cnt == null) visit_cnt = 0;

        console.log(`[OnJoin] ${client.sessionId}'s visiting count : ${visit_cnt}`)

        // [DataStorage] Player의 방문 횟수를 갱신한다음 Storage Save
        await storage.set("VisitCount", ++visit_cnt);
    }

    onTick(deltaTime: number): void {
        //  서버에서 설정된 타임마다 반복적으로 호출되며 deltaTime 을 이용하여 일정한 interval 이벤트를 관리할 수 있음.
    }

    async onLeave(client: SandboxPlayer, consented?: boolean) {

        // allowReconnection 설정을 통해 순단에 대한 connection 유지 처리등을 할 수 있으나 기본 가이드에서는 즉시 정리.
        // delete 된 player 객체에 대한 정보를 클라이언트에서는 players 객체에 add_OnRemove 이벤트를 추가하여 확인 할 수 있음.
        this.state.players.delete(client.sessionId);
        this.state.jumpTriggers.delete(client.sessionId);
        this.state.landingPoints.delete(client.sessionId);
        this.state.selfieIKs.delete(client.sessionId);
        this.state.gestures.delete(client.sessionId);
    }
}