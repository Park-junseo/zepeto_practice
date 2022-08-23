import { CharacterState, SpawnInfo, ZepetoPlayer, ZepetoPlayerControl, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { Room, RoomData } from 'ZEPETO.Multiplay';
import { Action, Player, State, Vector3 } from 'ZEPETO.Multiplay.Schema';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import { ZepetoWorldMultiplay } from 'ZEPETO.World';
import * as UnityEngine from "UnityEngine";
import { Text } from 'UnityEngine.UI';
import ZepetoUIAsset from '../Charactor Script/ZepetoUIAsset';

type TransformVector3 = {
    position: UnityEngine.Vector3;
    rotation: UnityEngine.Quaternion;
}

export default class ClientStarter extends ZepetoScriptBehaviour {

    public multiplay : ZepetoWorldMultiplay;
    public debugText: Text;
    private room : Room;
    private prevRotation: UnityEngine.Vector3 = UnityEngine.Vector3.zero;
    private prevPosition: UnityEngine.Vector3 = UnityEngine.Vector3.zero;

    private currentPlayers:Map<string,Player> = new Map<string,Player>();
    //private curretnPlayersAction:Map<string,Action> = new Map<string,Action>();
    private curPlayersPrevTransform:Map<string, TransformVector3> = new Map<string, TransformVector3>();
    //private curPlayersJumpTrigger:Map<string, Trigger> = new Map<string, Trigger>();

    private myZepetoPlayer:ZepetoPlayer;
    private myPlayerState: Player = null;

    private uiAsset: ZepetoUIAsset;

    private Start() {    
        this.multiplay.RoomCreated += (room:Room)=>{
            this.room = room;
        };

        this.multiplay.RoomJoined += (room:Room)=>{
            room.OnStateChange += this.OnStateChange;
        }

        this.StartCoroutine(this.SendMessageLoop(1.0));
    }

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

    // private *SendMessageLoop(tick:number) {
    //     const ticks = new UnityEngine.WaitForSeconds(tick);

    //     while(true) {
    //         //yield ticks;
    //         yield new UnityEngine.WaitForSeconds(tick);

    //         if(this.room != null && this.room.IsConnected) {
    //             const hasPlayer = ZepetoPlayers.instance.HasPlayer(this.room.SessionId);
    //             if(hasPlayer) {
    //                 const myPlayer = ZepetoPlayers.instance.GetPlayer(this.room.SessionId);
    //                 if(this.IsTimingUpdatePlayer(myPlayer)) {
    //                     this.SendTransform(myPlayer.character.transform);
                        
    //                 }
    //                 this.debugText.text = this.characterStateMap.get(myPlayer.character.CurrentState);
    //                 this.prevRotation = myPlayer.character.transform.localEulerAngles;
    //             }

    //             //console.log(`[sendMessageLoop] my position x: ${this.currentPlayers.get(this.room.SessionId)?.transform.position.x}`);
    //         }
    //     }
    // }

    private *SendMessageLoop(tick:number) {
        const ticks = new UnityEngine.WaitForSeconds(tick);

        while(true) {
            yield null;

            if(this.room != null && this.room.IsConnected && this.myPlayerState !== null) {
                const hasPlayer = ZepetoPlayers.instance.HasPlayer(this.room.SessionId);
                if(hasPlayer) {
                    this.myZepetoPlayer = ZepetoPlayers.instance.GetPlayer(this.room.SessionId);

                    this.uiAsset = ZepetoPlayers.instance.GetComponentInChildren<ZepetoUIAsset>();
                    if(this.uiAsset) {
                        this.uiAsset.jumpButton.onClick.AddListener(()=>{
                            this.room.Send("onJump");
                            console.log("jump");
                        });
                    }
                    break;
                }
            }
        }

        while(true) {
            yield ticks;

            if(this.room != null && this.room.IsConnected && this.myZepetoPlayer.isLoadedCharacter) {
                if(this.IsTimingUpdatePlayer(this.myZepetoPlayer)) {
                    this.SendTransform(this.myZepetoPlayer.character.transform);
                    
                }
                this.debugText.text = this.characterStateMap.get(this.myZepetoPlayer.character.CurrentState);
            }
        }
    }

    private IsTimingUpdatePlayer(myPlayer: ZepetoPlayer):boolean {
        //return myPlayer.character.CurrentState != CharacterState.Idle
        // !this.prevRotation.Equals(myPlayer.character.transform.localEulerAngles)
        // || !this.IsEqualVector3State(myPlayer.character.transform.localEulerAngles,this.myPlayerState.transform.rotation);

        return !this.IsEqualVector3State(myPlayer.character.transform.position,this.myPlayerState.transform.position) || 
        !this.IsEqualVector3State(myPlayer.character.transform.localEulerAngles,this.myPlayerState.transform.rotation);
    }

    private IsEqualVector3State(first: UnityEngine.Vector3, second: Vector3):boolean {
        return (
            first.x === second.x &&
            first.y === second.y &&
            first.z === second.z
        );
    }

    private OnJoinPlayer(sessionId: string, player:Player) {
        console.log(`[OnJoinPlayer] player - sessionId : ${sessionId}`);
        this.currentPlayers.set(sessionId, player);

        const spawnInfo = this.SetInitialSpawnInfo(player);

        //각 인스턴스의 위치정보 저장
        this.curPlayersPrevTransform.set(sessionId, {
            position: spawnInfo.position,
            rotation: spawnInfo.rotation
        });


        const isLocal = this.room.SessionId === player.sessionId;
        
        ZepetoPlayers.instance.CreatePlayerWithUserId(sessionId, player.zepetoUserId, spawnInfo, isLocal);
    }

    private SetInitialSpawnInfo(player: Player, initialPosition?:UnityEngine.Vector3, initialRotation?:UnityEngine.Vector3): SpawnInfo {
        const spawnInfo = new SpawnInfo();

        let position:UnityEngine.Vector3;
        let rotation:UnityEngine.Vector3;
        if(player.transform === null) {
            position = initialPosition || UnityEngine.Vector3.zero;
            rotation = initialRotation || UnityEngine.Vector3.zero;
        } else {
            position = this.ParseVector3(player.transform.position);
            rotation = this.ParseVector3(player.transform.rotation);
        }

        spawnInfo.position = position;
        spawnInfo.rotation = UnityEngine.Quaternion.Euler(rotation);

        return spawnInfo;
    }

    private OnLeavePlayer(sessionId:string, player:Player) {
        console.log(`[OnLeavePlayer] player - sessionId : ${sessionId}`);
        this.currentPlayers.delete(sessionId);
        //this.curretnPlayersAction.delete(sessionId);
        this.curPlayersPrevTransform.delete(sessionId);

        ZepetoPlayers.instance.RemovePlayer(sessionId);
    }

    private OnStateChange(state:State, isFirst: boolean) {
        if(isFirst) 
        {
            ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
                const myPlayer = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer;
                myPlayer.character.OnChangedState.AddListener((cur, prev)=>{
                    this.SendState(cur);
                });
            });

            

            ZepetoPlayers.instance.OnAddedPlayer.AddListener((sessionId:string)=>{
                const isLocal = this.room.SessionId === sessionId;
                if(!isLocal) {
                    const player:Player = this.currentPlayers.get(sessionId);

                    // Player 위치정보 리스너 추가
                    player.OnChange += (ChangeValues) => this.OnUpdatePlayer(sessionId, player);

                    // Player 액션 리스너 추가
                    const action:Action = this.room.State.actions.get_Item(sessionId);
                    action.OnChange += (ChangeValues) => this.JumpPlayer(sessionId, action);
                    //player.add_OnChange((ChangeValues) => this.OnUpdatePlayer(sessionId, player));
                } else {
                    this.myPlayerState = this.currentPlayers.get(sessionId);
                }
            });
        }
        
        let join = new Map<string, Player>();
        let leave = new Map<string, Player>(this.currentPlayers);

        state.players.ForEach((sessionId:string, player:Player)=>{
            if(!this.currentPlayers.has(sessionId)) join.set(sessionId, player);
            // else this.currentPlayers[sessionId] = player;
            leave.delete(sessionId);
        });

        join.forEach((player:Player, sessionId:string)=>this.OnJoinPlayer(sessionId, player));
        leave.forEach((player:Player, sessionId:string)=>this.OnLeavePlayer(sessionId, player));
    }

    private fixMagnitudeDelta = 1.0;
    private OnUpdatePlayer(sessionId: string, player: Player) { //자시의 로컬 인스턴스를 제외하고 실행시킴

        const position = this.ParseVector3(player.transform.position);
        const rotation = this.ParseVector3(player.transform.rotation);
        const zepetoPlayer = ZepetoPlayers.instance.GetPlayer(sessionId);
        const prevTransfromVector3 = this.curPlayersPrevTransform.get(sessionId);

        // if(!zepetoPlayer.character.transform.position.Equals(this.prevPosition))
        //     zepetoPlayer.character.transform.position = this.prevPosition;
        // if (zepetoPlayer.character.CurrentState === CharacterState.Idle)
        //     zepetoPlayer.character.transform.position = this.prevPosition;
        
        // if (player.state === CharacterState.Idle) {
        //     zepetoPlayer.character.transform.rotation = UnityEngine.Quaternion.Euler(rotation);
        //     //if(this.getMagnitude(zepetoPlayer.character.transform.localPosition, this.prevPosition) > this.fixMagnitudeDelta)
        //     zepetoPlayer.character.transform.position = this.prevPosition;
        // }

        // if (player.state === CharacterState.Idle && prevTransfromVector3) {
        //     zepetoPlayer.character.transform.localPosition = prevTransfromVector3.position;
        //     zepetoPlayer.character.transform.rotation = prevTransfromVector3.rotation;
        // }
            
        zepetoPlayer.character.MoveToPosition(position);

        //console.log(`${sessionId}'s position : ${position.ToString()}`);

        // if(player.state === CharacterState.JumpIdle || player.state === CharacterState.JumpMove || player.state === CharacterState.Jump)
        // {
        //     zepetoPlayer.character.Jump();
        // }
        
        //이전 위치 정보 업데이트
        if(prevTransfromVector3) {
            prevTransfromVector3.position = position;
            prevTransfromVector3.rotation = UnityEngine.Quaternion.Euler(rotation);
        }
    }

    private getMagnitude(first:UnityEngine.Vector3, second:UnityEngine.Vector3):number {
        const deltaX = first.x-second.x;
        const deltaY = first.y-second.y;
        const deltaZ = first.z-second.z;
        return deltaX*deltaX + deltaY*deltaY + deltaZ*deltaZ;
    }

    private JumpPlayer(sessionId: string, action:Action) {
        const zepetoPlayer = ZepetoPlayers.instance.GetPlayer(sessionId);

        zepetoPlayer.character.Jump();
    }
    
    private SendTransform(transform: UnityEngine.Transform) {
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

        //console.log(`[SendTransform] ${transform.rotation.ToString()}`);

        this.room.Send("onChangedTransform", data.GetObject());
    }

    private SendState(state:CharacterState) {
        const data = new RoomData();
        data.Add("state", state);
        this.room.Send("onChangeState", data.GetObject());
    }

    private SendJump() {
        this.room.Send("onJump");
    }

    private ParseVector3(vector3:Vector3):UnityEngine.Vector3 {
        return new UnityEngine.Vector3(
            vector3.x,
            vector3.y,
            vector3.z
        )
    }
}