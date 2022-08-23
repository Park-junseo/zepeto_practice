import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

export default class ZepetoObject extends ZepetoScriptBehaviour {

    Start() {    
        console.log(this.gameObject.name);
    }

}