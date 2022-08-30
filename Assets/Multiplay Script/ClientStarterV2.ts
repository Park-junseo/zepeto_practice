import {ZepetoScriptBehaviour} from 'ZEPETO.Script'
import {ZepetoWorldMultiplay} from 'ZEPETO.World'
import {Room, RoomData, ZepetoMultiplay$1} from 'ZEPETO.Multiplay'
import {LandingPoint, Player, SelfieIK, State, Trigger, Vector3} from 'ZEPETO.Multiplay.Schema'
import {CharacterState, SpawnInfo, ZepetoPlayers, ZepetoPlayer, CharacterJumpState, ZepetoCharacter, ZepetoPlayerControl, CharacterMoveState} from 'ZEPETO.Character.Controller'
import * as UnityEngine from "UnityEngine";
import { Text } from 'UnityEngine.UI';
import { UnityEvent$1 } from 'UnityEngine.Events'
import ClientIKManager from './ClientIKManager'
import ScreenShotModeManager from '../ScreenShotScripts/ScreenShotModeManager'
import PlayerIKController from './PlayerIKController'

type PlayerStatus = {
    state: CharacterState;
    position: UnityEngine.Vector3;
    rotation: UnityEngine.Quaternion;

    landingPosition?: UnityEngine.Vector3;
    landingRotation?: UnityEngine.Quaternion;
}

type Counter = {
    value: number;
}

type PlayerControlState = {
    playerState: Player;
    zepetoPlayer: ZepetoPlayer;
    jumpCounter: Counter;
    selfieIK:SelfieIK;
    isLoaded: boolean;
    isLocal: boolean;
}

export default class ClientStarterV2 extends ZepetoScriptBehaviour {

    private static Instance: ClientStarterV2;

    public multiplay: ZepetoWorldMultiplay;

    public debugText: Text;

    //private clientIKManager: ClientIKManager;

    private room: Room;
    // private currentPlayers: Map<string, Player> = new Map<string, Player>();
    // private curPlayersPrevplayerState:Map<string, PlayerStatus> = new Map<string, PlayerStatus>();
    // private curPlayersJumpCounter:Map<string, Counter> = new Map<string, Counter>();

    private curPlayerControlStates:Map<string, PlayerControlState> = new Map<string, PlayerControlState>();
    private curPlayerSessionIds:string[] = [];

    private zepetoPlayer: ZepetoPlayer = undefined;

    // action
    private jumpCountHandler: number;

    private characterStateMap = new Map<CharacterState,string>([
        [0,"Invalid"],
        [1,"Idle"],
        [2,"Walk"],
        [3,"Run"],
        [4,"JumpIdle"],
        [5,"JumpMove"],
        [20,"Teleport"],
        [30,"Gesture"],
        [102,"Move"],
        [103,"MoveTurn"],
        [104,"Jump"],
        [106,"Stamp"],
        [108,"Falling"],
        [109,"Landing"],
    ]);

    private characterMoveStateMap = new Map<CharacterMoveState,string>([
        [-1,"None"],
        [0,"MoveWalk"],
        [1,"MoveRun"],
    ]);

    private characterJumpStateMap = new Map<CharacterJumpState,string>([
        [-1,"None"],
        [0,"JumpIdle"],
        [1,"JumpMove"],
        [2,"JumpDash"],
        [3,"JumpDouble"],
    ]);

    private unableJumpStates = [
        CharacterState.Jump,
        CharacterState.Falling,
        CharacterState.Landing,
        CharacterState.Teleport, 
        CharacterState.Invalid,
    ];

    private stopPlayerStates = [
        CharacterState.Idle,
        CharacterState.Stamp,
        CharacterState.Landing,
    ]

    private Awake() {
        ClientStarterV2.Instance = this;
        //this.clientIKManager = this.clientIKManager || this.gameObject.AddComponent<ClientIKManager>();
    }

    private Start() {

        this.multiplay.RoomCreated += (room: Room) => {
            this.room = room;
        };

        this.multiplay.RoomJoined += (room: Room) => {
            room.OnStateChange += this.OnStateChange;
        };

        this.StartCoroutine(this.SendMessageLoop(0.04));
        this.StartCoroutine(this.CheckValidControl(1.0));
        this.StartCoroutine(this.HandlePlayerInstances());
        //this.StartCoroutine(this.FixRotation());

        // ZepetoPlayers.instance.controllerData.controlMode = 1;
    }

    // Send the local character transform to the server at the scheduled Interval Time.
    private* SendMessageLoop(tick: number) {
        const secondsTick = new UnityEngine.WaitForSeconds(tick);

        let character: ZepetoCharacter;

        while (true) {
            yield null;
            if (this.room != null && this.room.IsConnected) {
                // const hasPlayer = ZepetoPlayers.instance.HasPlayer(this.room.SessionId);
                // if (hasPlayer) {
                //     character = ZepetoPlayers.instance.GetPlayer(this.room.SessionId).character;        
                //     // console.log(ZepetoPlayers.instance.motionV2Data.jumpDashSpeedThreshold);                          
                //     break;
                // }
                if(this.zepetoPlayer) {
                    character = this.zepetoPlayer.character;
                    break;
                }
            }
        }

        let haveToSendisActiveSelfie = true;
        let prevState = character.CurrentState;
        while (true) {
            yield new UnityEngine.WaitForEndOfFrame();

            if (this.room != null && this.room.IsConnected && character.isActiveAndEnabled) {

                // if(!(character.CurrentState === CharacterState.Idle && prevState === CharacterState.Idle)) {
                //     this.SendTransform(character.transform, character.CurrentState);
                //     // this.SendState(character.CurrentState);
                // }
                this.SendTransform(character.transform, character.CurrentState);
                this.SendState(character.CurrentState);
                prevState = character.CurrentState;

                if(ScreenShotModeManager.GetInstance().isActiveSelfie) {
                    this.SendSelfieIK(...(ScreenShotModeManager.GetInstance().GetIKController().GetLookAtAndTargetAt()));
                    haveToSendisActiveSelfie = true;
                } else if(haveToSendisActiveSelfie) {
                    this.SendSelfieExit();
                    haveToSendisActiveSelfie = false;
                }
                // this.JumpThisPlayer();
                // this.CheckValidGoundLayer(character);
                this.debugText.text = `${this.characterStateMap.get(character.CurrentState)}/${this.characterMoveStateMap.get(character.MotionV2.CurrentMoveState)}/${this.characterJumpStateMap.get(character.MotionV2.CurrentJumpState)} camera:${ScreenShotModeManager.GetInstance().isActiveSelfie}`;
                this.debugText.text += `move: ${character.characterController.velocity.ToString()}`;
            }
            yield secondsTick;
        }
    }

    private* CheckValidControl(tick: number) {
        const ticks = new UnityEngine.WaitForSeconds(tick);

        while(!(this.zepetoPlayer?.isLoadedCharacter && this.zepetoPlayer.character.isActiveAndEnabled)) {
            yield null;
        }

        while(true) {
            this.CheckValidGoundLayer(this.zepetoPlayer.character);
            yield ticks;
        }
    }

    private OnStateChange(state: State, isFirst: boolean) {

        // When the first OnStateChange event is received, a full state snapshot is recorded.
        if (isFirst) {

            // [CharacterController] (Local) Called when the Player instance is fully loaded in Scene
            ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {

                this.zepetoPlayer = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer;

                // 점프 카운트 핸들러
                this.zepetoPlayer.character.OnUpdateState.AddListener((cur)=>{
                    //if(this.zepetoPlayer.character.tryJump) console.log(`[OnStateChage] ${this.characterStateMap.get(cur)}/${this.characterStateMap.get(this.zepetoPlayer.character.CurrentState)}`);
                    if(this.zepetoPlayer.character.tryJump) this.SendPlayerJump(cur);
                    
                });

                // // 랜딩 핸들러
                // this.zepetoPlayer.character.OnChangedState.AddListener((cur, prev)=>this.SendPlayerLanding(this.zepetoPlayer.character.transform, cur, prev));

                //ZepetoPlayers.instance.ZepetoCamera.


            });

            // [CharacterController] (Local) Called when the Player instance is fully loaded in Scene
            ZepetoPlayers.instance.OnAddedPlayer.AddListener((sessionId: string) => {
                const isLocal = this.room.SessionId === sessionId;

                if (!isLocal) {
                    const playerControlStates = this.curPlayerControlStates.get(sessionId);
                    playerControlStates.zepetoPlayer = ZepetoPlayers.instance.GetPlayer(sessionId);
                    playerControlStates.isLoaded = true;
                    
                    // const player: Player = this.currentPlayers.get(sessionId);
                    const jumpTrigger: Trigger = this.room.State.jumpTriggers.get_Item(sessionId);
                    // const landingPoint: LandingPoint = this.room.State.landingPoints.get_Item(sessionId);

                    // const prevPlayerState = this.curPlayersPrevplayerState.get(sessionId);
                    // const jumpCounter = this.curPlayersJumpCounter.get(sessionId);

                    // [RoomState] Called whenever the state of the player instance is updated. 
                    playerControlStates.playerState.OnChange += (changeValues) => {
                        this.OnUpdatePlayer(playerControlStates.zepetoPlayer, playerControlStates.playerState);
                        //console.log(temp);
                    }                    
                    jumpTrigger.OnChange += (changeVlaues) => this.HandleJumpCounter(playerControlStates.jumpCounter);
                    // trigger.OnChange += (changeVlaues) => this.StartCoroutine(this.OnHandlePlayerJump(zepetoPlayer.character, jumpCounter));
                    
                    // zepetoPlayer.character.OnChangedState.AddListener((cur,prev)=>this.FixPlayerLandingPoint(
                    //     zepetoPlayer.character,
                    //     //prevPlayerState,
                    //     landingPoint,
                    //     cur,
                    //     prev
                    // ));
                    // zepetoPlayer.character.OnChangedState.AddListener((cur,prev)=>{
                    //     this.OnJumpPlayer(zepetoPlayer.character, jumpCounter, cur, prev)
                    // });

                    playerControlStates.zepetoPlayer.character.ZepetoAnimator.gameObject.AddComponent<PlayerIKController>().Init(playerControlStates.selfieIK);

                } 
                
            });
        }

        let join = new Map<string, Player>();
        // let leave = [...this.curPlayerSessionIds];
        let leave = [...this.curPlayerControlStates.keys()];

        state.players.ForEach((sessionId: string, player: Player) => {
            if (!this.curPlayerControlStates.has(sessionId)) {
                join.set(sessionId, player);
            }
            if(leave.length>0) leave[leave.indexOf(sessionId)] = '';//leave.delete(sessionId);
        });

        //const prevPlayerCount = this.curPlayerControlStates.size;
        // [RoomState] Create a player instance for players that enter the Room
        join.forEach((player: Player, sessionId: string) => this.OnJoinPlayer(sessionId, player, state.selfieIKs.get_Item(sessionId)));
        // if(join.size>0 && prevPlayerCount + join.size === this.curPlayerControlStates.size)
        //     // this.curPlayerSessionIds.push(...join.keys());
        //     this.curPlayerSessionIds = [...this.curPlayerControlStates.keys()];

        // [RoomState] Remove the player instance for players that exit the room
        //leave.forEach((player: Player, sessionId: string) => this.OnLeavePlayer(sessionId, player));
        leave = leave.filter((sessionId) => sessionId !== '');
        leave.forEach((sessionId:string)=>this.OnLeavePlayer(sessionId));
        // if(leave.length > 0)
        //     this.curPlayerSessionIds = [...this.curPlayerControlStates.keys()];
    }

    private OnJoinPlayer(sessionId: string, player: Player, selfieIK:SelfieIK) {
        if(!player || !selfieIK) return;

        console.log(`[OnJoinPlayer] players - sessionId : ${sessionId}`);
        // this.currentPlayers.set(sessionId, player);

        const spawnInfo = new SpawnInfo();
        const position = ClientStarterV2.ParseVector3(player.transform.position);
        const rotation = ClientStarterV2.ParseVector3(player.transform.rotation);
        spawnInfo.position = position;
        spawnInfo.rotation = UnityEngine.Quaternion.Euler(rotation);

        // this.curPlayersPrevplayerState.set(sessionId, {
        //     state: player.state,
        //     position: position,
        //     rotation: UnityEngine.Quaternion.Euler(rotation)
        // });

        // this.curPlayersJumpCounter.set(sessionId, {value:0});

        // if(sessionId !== this.room.SessionId) this.clientIKManager.AddPlayerIK(sessionId, selfieIK);

        const isLocal = this.room.SessionId === player.sessionId;

        this.curPlayerControlStates.set(sessionId, {
            playerState: player,
            zepetoPlayer: undefined,
            jumpCounter: {value:0},
            selfieIK: selfieIK,
            isLoaded: false,
            isLocal: isLocal
        });

        ZepetoPlayers.instance.CreatePlayerWithUserId(sessionId, player.zepetoUserId, spawnInfo, isLocal);
    }

    private OnLeavePlayer(sessionId: string) {
        console.log(`[OnRemove] players - sessionId : ${sessionId}`);
        // this.currentPlayers.get(sessionId).OnChange = null;
        // this.currentPlayers.get(sessionId).OnChange = null;
        // this.currentPlayers.delete(sessionId);
        // this.curPlayersPrevplayerState.delete(sessionId);
        // this.curPlayersJumpCounter.delete(sessionId);

        // if(sessionId !== this.room.SessionId) this.clientIKManager.DeletePlayerIK(sessionId);

        ZepetoPlayers.instance.RemovePlayer(sessionId);
        const state = this.curPlayerControlStates.get(sessionId);
        // state.playerState.OnChange = null;
        // delete state.jumpCounter;
        // delete state.playerState;
        // delete state.zepetoPlayer;
        // delete state.selfieIK;
        this.curPlayerControlStates.delete(sessionId);
    }

    private OnUpdatePlayer(zepetoPlayer: ZepetoPlayer, player: Player) {

        const position = ClientStarterV2.ParseVector3(player.transform.position);
        const rotation = ClientStarterV2.ParseVector3(player.transform.rotation);

        var moveDir = UnityEngine.Vector3.op_Subtraction(position, zepetoPlayer.character.transform.position);
        moveDir = new UnityEngine.Vector3(moveDir.x, 0, moveDir.z);


        // 동기화2
        const curSpeed = zepetoPlayer.character.characterController.velocity.magnitude;
        let moveDelta = moveDir.magnitude;

        if(curSpeed === 0 && this.stopPlayerStates.includes(player.state)) {
            zepetoPlayer.character.StopMoving();
            zepetoPlayer.character.transform.position = position;
            moveDelta = 0;
            if(!player.isSelfieIK) zepetoPlayer.character.transform.rotation.eulerAngles = rotation;
        }
        
        if (moveDelta < 0.05 && this.stopPlayerStates.includes(player.state)) {
        // if (moveDelta < 0.05) {
            // if (player.state === CharacterState.MoveTurn)
            //     return;
            zepetoPlayer.character.StopMoving();
        } else {
            zepetoPlayer.character.MoveContinuously(moveDir);
        }

        console.log(`[UpdatePlayer]${player.sessionId}: ${moveDelta}/${curSpeed}/${this.characterStateMap.get(player.state)}`);
    }

    private HandleJumpCounter(jumpCounter: Counter) {
        jumpCounter.value += 1;
    };

    // private* OnHandlePlayerJump(character:ZepetoCharacter, jumpCounter: Counter) {
    //     jumpCounter.value += 1;

    //     while(true) {
    //         if(jumpCounter.value > 0 && character && !this.unableJumpStates.includes(character.CurrentState)) {
    //             character.Jump();
    //             jumpCounter.value -= 1;
    //             break;
    //         }
    //         yield null;
    //     }
    // };

    // private JumpThisPlayer() {
    //     // this.curPlayerControlStates.forEach((playerControlStates:Counter, sessionId:string)=>{
    //     //     // 점프하기
    //     //     if(jumpCounter.value > 0) {
    //     //         const character = ZepetoPlayers.instance.GetPlayer(sessionId).character;
    //     //         if(character && !this.unableJumpStates.includes(character.CurrentState)) {
    //     //             character.Jump();
    //     //             jumpCounter.value -= 1;
    //     //         }
    //     //     }
    //     // });
    // }

    private SetJumpPlayerInstance(character:ZepetoCharacter, jumpCounter: Counter) {
        if(!jumpCounter) return;

        if(jumpCounter.value > 0) {
            if(!this.unableJumpStates.includes(character.CurrentState)) {
                character.Jump();
                jumpCounter.value -= 1;
            }
        }
    }

    private SetLookAtPlayerInstance(character:ZepetoCharacter, selfieIK:SelfieIK) {
        if(!(selfieIK && selfieIK.isSelfie)) return;

        const lookAtVector = ClientStarterV2.ParseVector3(selfieIK.lookAt);

        // character.transform.rotation.SetLookRotation(lookAtVector);// = lookAtVector;// = Quaternion.Euler(lookAtVector);
        character.transform.LookAt(lookAtVector);
        character.transform.eulerAngles = new UnityEngine.Vector3(0, character.transform.eulerAngles.y, 0);
        //console.log(`${sessionId}: ${character.transform.rotation.eulerAngles.ToString()}`);
    }

    private* HandlePlayerInstances() {
        while(true) {
            this.curPlayerControlStates.forEach((controlStates:PlayerControlState, sessionId:string)=>{
                if(controlStates.isLocal || !controlStates.isLoaded || !controlStates.zepetoPlayer) return;
                
                // this.OnUpdatePlayer(controlStates.zepetoPlayer, controlStates.playerState);
                this.SetJumpPlayerInstance(controlStates.zepetoPlayer.character, controlStates.jumpCounter);
                this.SetLookAtPlayerInstance(controlStates.zepetoPlayer.character, controlStates.selfieIK);
            });
            yield null;
        }
    }

    // private OnJumpPlayer(character: ZepetoCharacter, jumpCounter:Counter, curState:CharacterState, prevState:CharacterState) {
    //     if(jumpCounter.value > 0) {
    //         if(character && !this.unableJumpStates.includes(curState)) {
    //             character.Jump();
    //             jumpCounter.value -= 1;
    //         }
    //     }
    // }

    // private FixPlayerLandingPointWithState(character: ZepetoCharacter, playerState:PlayerStatus, curState:CharacterState, prevState:CharacterState) {
    //     if(prevState===CharacterState.Jump || prevState === CharacterState.Falling && 
    //         curState!==CharacterState.Jump && curState !== CharacterState.Falling &&
    //         (playerState.landingPosition !== null && playerState.landingRotation !== null)) {
    //             character.transform.position = playerState.landingPosition;
    //             character.transform.rotation = playerState.landingRotation;
        
    //             playerState.landingPosition = null;
    //             playerState.landingRotation = null;
    //         }
    // }

    // private FixPlayerLandingPoint(character: ZepetoCharacter, landingPoint:LandingPoint, curState:CharacterState, prevState:CharacterState) {
    //     if(prevState===CharacterState.Jump || prevState === CharacterState.Falling && 
    //         curState!==CharacterState.Jump && curState !== CharacterState.Falling) {
    //             const position = ClientStarterV2.ParseVector3(landingPoint.transform.position);
    //             const rotation = UnityEngine.Quaternion.Euler(ClientStarterV2.ParseVector3(landingPoint.transform.rotation));

    //             character.transform.position = position;
    //             character.transform.rotation = rotation;

    //         }
    // }

    // private IsEqualVector3State(first: UnityEngine.Vector3, second: Vector3):boolean {
    //     return (
    //         first.x === second.x &&
    //         first.y === second.y &&
    //         first.z === second.z
    //     );
    // }

    private CheckValidGoundLayer(character:ZepetoCharacter) {
        let ref = $ref<UnityEngine.RaycastHit>(); 

        if(UnityEngine.Physics.Raycast(character.transform.position, UnityEngine.Vector3.down, ref, 1000)) {
            let hitInfo = $unref(ref);  
        } else {
            character.Teleport(UnityEngine.Vector3.zero,UnityEngine.Quaternion.Euler(UnityEngine.Vector3.zero));
        }
    }

    private SendTransform(transform: UnityEngine.Transform, state: CharacterState) {
        const data = new RoomData();

        const pos = new RoomData();
        pos.Add("x", transform.localPosition.x);
        pos.Add("y", transform.localPosition.y);
        pos.Add("z", transform.localPosition.z);
        data.Add("position", pos.GetObject());

        const rot = new RoomData();
        rot.Add("x", transform.localEulerAngles.x);
        rot.Add("y", transform.localEulerAngles.y);
        rot.Add("z", transform.localEulerAngles.z);
        data.Add("rotation", rot.GetObject());

        //data.Add("expectedState", state);

        this.room.Send("onChangedTransform", data.GetObject());
    }

    private SendState(state: CharacterState) {
        const data = new RoomData();
        data.Add("state", state);
        if(state === CharacterState.Jump) { 
            data.Add("subState", this.zepetoPlayer.character.MotionV2.CurrentJumpState);
        }
        this.room.Send("onChangedState", data.GetObject());
    }

    private SendSelfieIK(lookAt?:UnityEngine.Vector3, targetAt?:UnityEngine.Vector3){
        if(lookAt && targetAt) {

            const data = new RoomData();
            
            data.Add("isSelfie" , true);

            const lookAtData = new RoomData();
            lookAtData.Add("x", lookAt.x);
            lookAtData.Add("y", lookAt.y);
            lookAtData.Add("z", lookAt.z);
            data.Add("lookAt", lookAtData.GetObject());

            const targetAtData = new RoomData();
            targetAtData.Add("x", targetAt.x);
            targetAtData.Add("y", targetAt.y);
            targetAtData.Add("z", targetAt.z);
            data.Add("targetAt", targetAtData.GetObject());

            this.room.Send("onSelfieIK", data.GetObject());

        }
    }

    private SendSelfieExit() {
        const data = new RoomData();
            
        data.Add("isSelfie" , false);

        this.room.Send("onSelfieIKExit", data.GetObject());
    }

    // private SendPlayerLanding(transform: UnityEngine.Transform, curState: CharacterState, prevState: CharacterState) {

    //     if(prevState===CharacterState.Jump || prevState === CharacterState.Falling && 
    //         curState!==CharacterState.Jump && curState !== CharacterState.Falling) {
    //             const data = new RoomData();

    //             const pos = new RoomData();
    //             pos.Add("x", transform.localPosition.x);
    //             pos.Add("y", transform.localPosition.y);
    //             pos.Add("z", transform.localPosition.z);
    //             data.Add("position", pos.GetObject());
        
    //             const rot = new RoomData();
    //             rot.Add("x", transform.localEulerAngles.x);
    //             rot.Add("y", transform.localEulerAngles.y);
    //             rot.Add("z", transform.localEulerAngles.z);
    //             data.Add("rotation", rot.GetObject());
    //             this.room.Send("onPlayerLanding", data.GetObject());
        
    //             console.log(`[SendLandingPOint] ${transform.localPosition.ToString()}`);
    //     }
    // }

    // private* FixRotation () {
    //     while(true) {
    //         this.currentPlayers.forEach((value: Player,sessionId: string) => {
    //             if(this.room.SessionId !== sessionId && ZepetoPlayers.instance.HasPlayer(sessionId)) {
    //                 const player = ZepetoPlayers.instance.GetPlayer(sessionId);
    //                 player.character.transform.rotation = UnityEngine.Quaternion.Euler(UnityEngine.Vector3.zero);
    //                 console.log(`[FixRotation] ${sessionId}: ${player.character.transform.rotation.ToString()}`);
    //             }
    //         });
    //         yield new UnityEngine.WaitUntil(()=>true);
    //     }
    // }

    // LateUpdate() {
    //     this.currentPlayers.forEach((value: Player,sessionId: string) => {
    //         if(this.room.SessionId !== sessionId && ZepetoPlayers.instance.HasPlayer(sessionId)) {
    //             const player = ZepetoPlayers.instance.GetPlayer(sessionId);
    //             player.character.transform.rotation = UnityEngine.Quaternion.Euler(UnityEngine.Vector3.zero);
    //             console.log(`[FixRotation] ${sessionId}: ${player.character.transform.rotation.ToString()}`);
    //         }
    //     });
    // }

    /*-------------------public---------------------*/
    public static GetInstance(): ClientStarterV2 {
        if(!ClientStarterV2.Instance) {

            var _obj = new UnityEngine.GameObject("ClientStarter");
            UnityEngine.GameObject.DontDestroyOnLoad(_obj);
            ClientStarterV2.Instance = _obj.AddComponent<ClientStarterV2>();
        }

        return ClientStarterV2.Instance;
    }
    
    public SendPlayerJump(state: CharacterState) {
        if(!this.unableJumpStates.includes(state)) {
            this.room.Send("onPlayerJump");
            console.log("[SendPlayerJump] jump!")
        }
    }

    public static ParseVector3(vector3: Vector3): UnityEngine.Vector3 {
        return new UnityEngine.Vector3
        (
            vector3.x,
            vector3.y,
            vector3.z
        );
    }
}
