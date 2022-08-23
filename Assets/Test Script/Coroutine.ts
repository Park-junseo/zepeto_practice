import {ZepetoScriptBehaviour} from "ZEPETO.Script";
import {WaitForSeconds} from "UnityEngine";
export default class Coroutine extends ZepetoScriptBehaviour {

    @SerializeField()
   private current: number;
   Start()
   {
       this.current = 0;
       console.log(`start routine`);
       this.StartCoroutine(this.DoRoutine());
   }
 
   *DoRoutine() {
       while(this.current < 30 ) {
           yield null;
           console.log(`[${this.current++}] Wait to next routine..`);
           yield new WaitForSeconds(1);
       }
   }
}