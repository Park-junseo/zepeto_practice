import * as UnityEngine from 'UnityEngine';
import { ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { SelfieIK } from 'ZEPETO.Multiplay.Schema';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import ScreenShotModeManager from '../ScreenShotScripts/ScreenShotModeManager';
import ClientStarterV2 from './ClientStarterV2';

export default class ClientIKManager extends ZepetoScriptBehaviour {

    private curPlayersIK:Map<string, SelfieIK> = new Map<string, SelfieIK>();

    Start() {    
        this.StartCoroutine(this.FixSelfieRotation());
    }

    // OnAnimatorIK() {
    //     const bodyWeight = ScreenShotModeManager.GetInstance().GetIKController().bodyWeight;
    //     const headWeight = ScreenShotModeManager.GetInstance().GetIKController().headWeight;
    //     this.curPlayersIK.forEach((selfieIK:SelfieIK, sessionId:string)=>{
    //         if(!selfieIK.isSelfie || !ZepetoPlayers.instance.HasPlayer(sessionId)) return;
    //         console.log(`${sessionId} ik: ${selfieIK.isSelfie}`);
    //         const character = ZepetoPlayers.instance.GetPlayer(sessionId).character;

    //         const targetAtVector = ClientStarterV2.ParseVector3(selfieIK.targetAt);
    //         const lookAtVector = ClientStarterV2.ParseVector3(selfieIK.lookAt);

    //         character.ZepetoAnimator.SetLookAtWeight(1, bodyWeight, headWeight);
    //         character.ZepetoAnimator.SetLookAtPosition(lookAtVector);

    //         character.ZepetoAnimator.SetIKPositionWeight(UnityEngine.AvatarIKGoal.RightHand, 1);
    //         character.ZepetoAnimator.SetIKPosition(UnityEngine.AvatarIKGoal.RightHand, targetAtVector);
    //     });
    // }

    private* FixSelfieRotation() {
        while(true)
        {
            this.curPlayersIK.forEach((selfieIK:SelfieIK, sessionId:string)=>{
                if(selfieIK.isSelfie && ZepetoPlayers.instance.HasPlayer(sessionId)) {
                    const character = ZepetoPlayers.instance.GetPlayer(sessionId).character;
                    const lookAtVector = ClientStarterV2.ParseVector3(selfieIK.lookAt);
    
                    // character.transform.rotation.SetLookRotation(lookAtVector);// = lookAtVector;// = Quaternion.Euler(lookAtVector);
                    character.transform.LookAt(lookAtVector);
                    character.transform.eulerAngles = new UnityEngine.Vector3(0, character.transform.eulerAngles.y, 0);
                    //console.log(`${sessionId}: ${character.transform.rotation.eulerAngles.ToString()}`);
                }
            });
            yield null;
        }
    }

    // LateUpdate() {
    //     this.curPlayersIK.forEach((selfieIK:SelfieIK, sessionId:string)=>{
    //         if(!selfieIK.isSelfie || !ZepetoPlayers.instance.HasPlayer(sessionId)) return;
    //         const character = ZepetoPlayers.instance.GetPlayer(sessionId).character;
    //         const lookAtVector = ClientStarterV2.ParseVector3(selfieIK.lookAt);

    //         //character.transform.rotation.SetLookRotation(lookAtVector);// = lookAtVector;// = Quaternion.Euler(lookAtVector);
    //         character.transform.LookAt(lookAtVector);
    //         character.transform.eulerAngles = new UnityEngine.Vector3(0, character.transform.eulerAngles.y, 0);
    //         console.log(`${sessionId}: ${character.transform.rotation.eulerAngles.ToString()}`);
    //     });
    // }

    public AddPlayerIK(sessionId:string, selfieIK: SelfieIK) {
        this.curPlayersIK.set(sessionId, selfieIK);
        console.log(`${sessionId} ik: ${this.curPlayersIK.size}`);
    }

    public DeletePlayerIK(sessionId:string) {
        this.curPlayersIK.delete(sessionId);
    }

}