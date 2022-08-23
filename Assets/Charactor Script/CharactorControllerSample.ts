import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { SpawnInfo, ZepetoPlayers, LocalPlayer, ZepetoCharacter } from 
'ZEPETO.Character.Controller'

import {Vector3} from "UnityEngine";
 
export default class CharacterControllerSample extends ZepetoScriptBehaviour {

   Start() {        
       ZepetoPlayers.instance.CreatePlayerWithZepetoId("", "pjs2008", new SpawnInfo(), true);
 
       ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
           let _player : LocalPlayer = ZepetoPlayers.instance.LocalPlayer;

           _player.zepetoPlayer.character.MoveToPosition(new Vector3(10,5,0));
           console.log(`CurrentState: ${_player.zepetoPlayer.character.CurrentState}`);
       });
       
   }
}