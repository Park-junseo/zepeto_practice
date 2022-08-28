import { SelfieIK } from 'ZEPETO.Multiplay.Schema';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

export default class ClientIKManager extends ZepetoScriptBehaviour {

    private curPlayersIK:Map<string, SelfieIK> = new Map<string, SelfieIK>();

    Start() {    

    }

    OnAnimatorIK() {

    }

    LateUpdate() {
        
    }

    public AddPlayerIK(sessionId:string, selfieIK?: SelfieIK) {
        if (!selfieIK) selfieIK = new SelfieIK();
        this.curPlayersIK.set(sessionId, selfieIK);
    }

    public DeletePlayerIK(sessionId:string) {
        this.curPlayersIK.delete(sessionId);
    }

}