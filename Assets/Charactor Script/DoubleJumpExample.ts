import {ZepetoScriptBehaviour} from "ZEPETO.Script";
import {Button} from "UnityEngine.UI";
import {CharacterState, ZepetoCharacter, ZepetoPlayers} from "ZEPETO.Character.Controller";
import { Vector2 } from "UnityEngine";
export default class DoubleJumpExample extends ZepetoScriptBehaviour {
     public shotButton : Button;
     private zepetoCharacter: ZepetoCharacter;
    Start() {
         // Create character
         ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
             this.zepetoCharacter = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;
         });

         this.zepetoCharacter = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;

         // Add script component
         this.shotButton.onClick.AddListener(() => {                    
            if(this.zepetoCharacter == null ) return;
            
            console.log(`CurrentState: ${this.zepetoCharacter.CurrentState} / ${CharacterState.Jump}`)

            if(this.zepetoCharacter.CurrentState === CharacterState.Jump)                              
            {                
                this.zepetoCharacter.DoubleJump();            
            }
            else
            {                
                this.zepetoCharacter.Jump();            
            }
         });

         console.log(`Ready UI jump`);
    }

    public ConsoleLog(vector2: Vector2) {
        console.log(vector2.ToString());
    }
}