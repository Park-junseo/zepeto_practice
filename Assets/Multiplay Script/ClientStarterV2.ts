import {ZepetoScriptBehaviour} from 'ZEPETO.Script'
import {ZepetoWorldMultiplay} from 'ZEPETO.World'
import {Room, RoomData, ZepetoMultiplay$1} from 'ZEPETO.Multiplay'
import {LandingPoint, Player, State, Trigger, Vector3} from 'ZEPETO.Multiplay.Schema'
import {CharacterState, SpawnInfo, ZepetoPlayers, ZepetoPlayer, CharacterJumpState, ZepetoCharacter, ZepetoPlayerControl} from 'ZEPETO.Character.Controller'
import * as UnityEngine from "UnityEngine";
import { Text } from 'UnityEngine.UI';
import { UnityEvent$1 } from 'UnityEngine.Events'

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

export default class ClientStarterV2 extends ZepetoScriptBehaviour {

    public multiplay: ZepetoWorldMultiplay;

    public debugText: Text;

    private room: Room;
    private currentPlayers: Map<string, Player> = new Map<string, Player>();
    private curPlayersPrevplayerState:Map<string, PlayerStatus> = new Map<string, PlayerStatus>();
    private curPlayersJumpCounter:Map<string, Counter> = new Map<string, Counter>();

    private zepetoPlayer: ZepetoPlayer;

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

    private unableJumpStates = [
        CharacterState.Jump,
        CharacterState.Falling,
        CharacterState.Landing,
        CharacterState.Teleport, 
        CharacterState.Invalid,
    ];

    private Start() {

        this.multiplay.RoomCreated += (room: Room) => {
            this.room = room;
        };

        this.multiplay.RoomJoined += (room: Room) => {
            room.OnStateChange += this.OnStateChange;
        };

        this.StartCoroutine(this.SendMessageLoop(0.04));
        this.StartCoroutine(this.CheckValidControl(1.0));

    }

    // Send the local character transform to the server at the scheduled Interval Time.
    private* SendMessageLoop(tick: number) {
        const secondsTick = new UnityEngine.WaitForSeconds(tick);

        let character: ZepetoCharacter;

        while (true) {
            yield null;
            if (this.room != null && this.room.IsConnected) {
                const hasPlayer = ZepetoPlayers.instance.HasPlayer(this.room.SessionId);
                if (hasPlayer) {
                    character = ZepetoPlayers.instance.GetPlayer(this.room.SessionId).character;                                  
                    break;
                }
            }
        }

        const playerState = this.curPlayersPrevplayerState.get(this.room.SessionId);

        while (true) {
            if (this.room != null && this.room.IsConnected && character.isActiveAndEnabled) {
                if(character.CurrentState !== CharacterState.Idle || playerState.state !== CharacterState.Idle) {
                    this.SendTransform(character.transform, character.CurrentState);
                    this.SendState(character.CurrentState);
                }
                this.JumpThisPlayer();
                this.CheckValidGoundLayer(character);
                this.debugText.text = this.characterStateMap.get(character.CurrentState);
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
                    const player: Player = this.currentPlayers.get(sessionId);
                    const trigger: Trigger = this.room.State.jumpTriggers.get_Item(sessionId);
                    const landingPoint: LandingPoint = this.room.State.landingPoints.get_Item(sessionId);


                    const zepetoPlayer = ZepetoPlayers.instance.GetPlayer(sessionId);
                    const prevPlayerState = this.curPlayersPrevplayerState.get(sessionId);
                    const jumpCounter = this.curPlayersJumpCounter.get(sessionId);

                    let temp:string = '';
                    // [RoomState] Called whenever the state of the player instance is updated. 
                    player.OnChange += (changeValues) => {
                        this.OnUpdatePlayer(zepetoPlayer, prevPlayerState, player, jumpCounter, temp);
                        //console.log(temp);
                    }                    
                    trigger.OnChange += (changeVlaues) => this.HandleJumpCounter(jumpCounter);
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

                } 
                
            });
        }

        let join = new Map<string, Player>();
        let leave = new Map<string, Player>(this.currentPlayers);

        state.players.ForEach((sessionId: string, player: Player) => {
            if (!this.currentPlayers.has(sessionId)) {
                join.set(sessionId, player);
            }
            leave.delete(sessionId);
        });

        // [RoomState] Create a player instance for players that enter the Room
        join.forEach((player: Player, sessionId: string) => this.OnJoinPlayer(sessionId, player));

        // [RoomState] Remove the player instance for players that exit the room
        leave.forEach((player: Player, sessionId: string) => this.OnLeavePlayer(sessionId, player));
    }

    private OnJoinPlayer(sessionId: string, player: Player) {
        console.log(`[OnJoinPlayer] players - sessionId : ${sessionId}`);
        this.currentPlayers.set(sessionId, player);

        const spawnInfo = new SpawnInfo();
        const position = this.ParseVector3(player.transform.position);
        const rotation = this.ParseVector3(player.transform.rotation);
        spawnInfo.position = position;
        spawnInfo.rotation = UnityEngine.Quaternion.Euler(rotation);

        this.curPlayersPrevplayerState.set(sessionId, {
            state: player.state,
            position: position,
            rotation: UnityEngine.Quaternion.Euler(rotation)
        });

        this.curPlayersJumpCounter.set(sessionId, {value:0});

        const isLocal = this.room.SessionId === player.sessionId;
        ZepetoPlayers.instance.CreatePlayerWithUserId(sessionId, player.zepetoUserId, spawnInfo, isLocal);
    }

    private OnLeavePlayer(sessionId: string, player: Player) {
        console.log(`[OnRemove] players - sessionId : ${sessionId}`);
        this.currentPlayers.get(sessionId).OnChange = null;
        this.currentPlayers.get(sessionId).OnChange = null;
        this.currentPlayers.delete(sessionId);
        this.curPlayersPrevplayerState.delete(sessionId);
        this.curPlayersJumpCounter.delete(sessionId);

        ZepetoPlayers.instance.RemovePlayer(sessionId);
    }

    private OnUpdatePlayer(zepetoPlayer: ZepetoPlayer, prevPlayerState:PlayerStatus, player: Player,jumpCounter:Counter, $temp:string) {

        const position = this.ParseVector3(player.transform.position);
        const rotation = this.ParseVector3(player.transform.rotation);

        $temp = this.characterStateMap.get(player.state);

        // // 동기화 보정
        // // if(prevPlayerState.state === CharacterState.Idle && player.state === CharacterState.Idle)
        // if(prevPlayerState.state === CharacterState.Idle && player.state === CharacterState.Idle)
        // {
        //     if ((prevPlayerState.position.Equals(zepetoPlayer.character.transform.position) &&
        //         prevPlayerState.rotation.Equals(zepetoPlayer.character.transform.rotation)))
        //         return;
        //     zepetoPlayer.character.transform.position = prevPlayerState.position;
        //     zepetoPlayer.character.transform.rotation = prevPlayerState.rotation;
        // }

        // 동기화 보정
        // if(prevPlayerState.state === CharacterState.Idle && player.state === CharacterState.Idle)
        if((player.state === CharacterState.Idle || 
            player.state === CharacterState.Stamp ||
            player.state === CharacterState.Landing) &&
            player.state === prevPlayerState.state )
        {
            if ((prevPlayerState.position.Equals(zepetoPlayer.character.transform.position) &&
                prevPlayerState.rotation.Equals(zepetoPlayer.character.transform.rotation)))
                return;
            zepetoPlayer.character.transform.position = prevPlayerState.position;
            zepetoPlayer.character.transform.rotation = prevPlayerState.rotation;
        }

        // if((zepetoPlayer.character.CurrentState === CharacterState.Stamp || zepetoPlayer.character.CurrentState === CharacterState.Landing) && 
        //     (prevPlayerState.landingPosition && prevPlayerState.landingRotation))
        // {
        //     // if ((prevPlayerState.position.Equals(zepetoPlayer.character.transform.position) &&
        //     //     prevPlayerState.rotation.Equals(zepetoPlayer.character.transform.rotation)))
        //     //     return;
        //     // zepetoPlayer.character.transform.position = prevPlayerState.position;
        //     // zepetoPlayer.character.transform.rotation = prevPlayerState.rotation;

        //     zepetoPlayer.character.transform.position = prevPlayerState.landingPosition;
        //     zepetoPlayer.character.transform.rotation = prevPlayerState.landingRotation;

        //     prevPlayerState.landingPosition = null;
        //     prevPlayerState.landingRotation = null;
        // } 

        var moveDir = UnityEngine.Vector3.op_Subtraction(position, zepetoPlayer.character.transform.position);
        moveDir = new UnityEngine.Vector3(moveDir.x, 0, moveDir.z);

        if (moveDir.magnitude < 0.05) {
            if (player.state === CharacterState.MoveTurn)
                return;
            zepetoPlayer.character.StopMoving();
        } else {


            zepetoPlayer.character.MoveContinuously(moveDir);
        }

        if(prevPlayerState) {
            if(prevPlayerState.state === CharacterState.Jump || prevPlayerState.state === CharacterState.Falling && 
                player.state !==CharacterState.Jump && player.state !== CharacterState.Falling)
            {
                prevPlayerState.landingPosition = position;
                prevPlayerState.landingRotation = UnityEngine.Quaternion.Euler(rotation);
            } 

            prevPlayerState.state = player.state;//player.expectedState as CharacterState;
            prevPlayerState.position = position;
            prevPlayerState.rotation = UnityEngine.Quaternion.Euler(rotation);

            // if((player.state === CharacterState.Stamp || player.state === CharacterState.Landing) && 
            //     player.state !== prevPlayerState.state)
            // {
            //     // if ((prevPlayerState.position.Equals(zepetoPlayer.character.transform.position) &&
            //     //     prevPlayerState.rotation.Equals(zepetoPlayer.character.transform.rotation)))
            //     //     return;
            //     // zepetoPlayer.character.transform.position = prevPlayerState.position;
            //     // zepetoPlayer.character.transform.rotation = prevPlayerState.rotation;

            //     prevPlayerState.landingPosition = position;
            //     prevPlayerState.landingRotation = UnityEngine.Quaternion.Euler(rotation);
            // } 
        }
    }

    private HandleJumpCounter(jumpCounter: Counter) {
        jumpCounter.value += 1;
    };

    private* OnHandlePlayerJump(character:ZepetoCharacter, jumpCounter: Counter) {
        jumpCounter.value += 1;

        while(true) {
            if(jumpCounter.value > 0 && character && !this.unableJumpStates.includes(character.CurrentState)) {
                character.Jump();
                jumpCounter.value -= 1;
                break;
            }
            yield null;
        }
    };

    private JumpThisPlayer() {
        this.curPlayersJumpCounter.forEach((jumpCounter:Counter, sessionId:string)=>{
            // 점프하기
            if(jumpCounter.value > 0) {
                const character = ZepetoPlayers.instance.GetPlayer(sessionId).character;
                if(character && !this.unableJumpStates.includes(character.CurrentState)) {
                    character.Jump();
                    jumpCounter.value -= 1;
                }
            }
        });
    }

    private OnJumpPlayer(character: ZepetoCharacter, jumpCounter:Counter, curState:CharacterState, prevState:CharacterState) {
        if(jumpCounter.value > 0) {
            if(character && !this.unableJumpStates.includes(curState)) {
                character.Jump();
                jumpCounter.value -= 1;
            }
        }
    }

    private FixPlayerLandingPointWithState(character: ZepetoCharacter, playerState:PlayerStatus, curState:CharacterState, prevState:CharacterState) {
        if(prevState===CharacterState.Jump || prevState === CharacterState.Falling && 
            curState!==CharacterState.Jump && curState !== CharacterState.Falling &&
            (playerState.landingPosition !== null && playerState.landingRotation !== null)) {
                character.transform.position = playerState.landingPosition;
                character.transform.rotation = playerState.landingRotation;
        
                playerState.landingPosition = null;
                playerState.landingRotation = null;
            }
    }

    private FixPlayerLandingPoint(character: ZepetoCharacter, landingPoint:LandingPoint, curState:CharacterState, prevState:CharacterState) {
        if(prevState===CharacterState.Jump || prevState === CharacterState.Falling && 
            curState!==CharacterState.Jump && curState !== CharacterState.Falling) {
                const position = this.ParseVector3(landingPoint.transform.position);
                const rotation = UnityEngine.Quaternion.Euler(this.ParseVector3(landingPoint.transform.rotation));

                character.transform.position = position;
                character.transform.rotation = rotation;

            }
    }

    private IsEqualVector3State(first: UnityEngine.Vector3, second: Vector3):boolean {
        return (
            first.x === second.x &&
            first.y === second.y &&
            first.z === second.z
        );
    }

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

        data.Add("expectedState", state);
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

    private SendPlayerLanding(transform: UnityEngine.Transform, curState: CharacterState, prevState: CharacterState) {

        if(prevState===CharacterState.Jump || prevState === CharacterState.Falling && 
            curState!==CharacterState.Jump && curState !== CharacterState.Falling) {
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
                this.room.Send("onPlayerLanding", data.GetObject());
        
                console.log(`[SendLandingPOint] ${transform.localPosition.ToString()}`);
        }
    }

    private ParseVector3(vector3: Vector3): UnityEngine.Vector3 {
        return new UnityEngine.Vector3
        (
            vector3.x,
            vector3.y,
            vector3.z
        );
    }

    /*-------------------public---------------------*/
    public SendPlayerJump(state: CharacterState) {
        if(!this.unableJumpStates.includes(state)) {
            this.room.Send("onPlayerJump");
            console.log("[SendPlayerJump] jump!")
        }
    }

}
