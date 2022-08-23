import { Vector3 } from 'UnityEngine';
import { ZepetoScriptBehaviour, ZepetoScriptableObject } from 'ZEPETO.Script'
// import scriptable object type definition
import PlayerScriptObjectRef from "./PlayerScriptObjectRef";
 

export default class ScriptableObject extends ZepetoScriptBehaviour {
     
   public player:ZepetoScriptableObject;
   public enemy:ZepetoScriptableObject<PlayerScriptObjectRef>; // generic type call
         

   Awake() {
 
       // direct access by name
       console.log(`play name : ${this.player["name"]}`);
       console.log(`play hp : ${this.player["hp"]}`);
       console.log(`play position : 
(${this.player["position"].x},${this.player["position"].y},${this.player["position"].z})`);
       console.log(`play rotation : 
(${this.player["rotation"].x},${this.player["rotation"].y},${this.player["rotation"].z})`);
 
       // generic data call
       let monsterState = this.enemy.targetObject;
       console.log(`enemy name :  ${monsterState.name}`);
       console.log(`enemy hp :  ${monsterState.hp}`);
       console.log(`enemy position : (${monsterState.position.x}, ${monsterState.position.y}, 
${monsterState.position.z})`);
       console.log(`enemy rotation : (${monsterState.rotation.x}, ${monsterState.rotation.y}, 
${monsterState.rotation.z})`);
 
       // type casting
       let playerPosition = this.player["position"] as Vector3;
       console.log(`player position : (x:${playerPosition.x}, y:${playerPosition.y}, 
z:${playerPosition.z})`);
 
       // generic type can access class member
       console.log(`enemy position : (x:${monsterState.position.x}, 
y:${monsterState.position.y}, z:${monsterState.position.z})`);
 
   }
 
}