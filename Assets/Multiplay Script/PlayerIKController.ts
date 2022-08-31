import { ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import ScreenShotModeManager from '../ScreenShotScripts/ScreenShotModeManager';
import ClientStarterV2 from './ClientStarterV2';
import * as UnityEngine from 'UnityEngine';
import { SelfieIK } from 'ZEPETO.Multiplay.Schema';

export default class PlayerIKController extends ZepetoScriptBehaviour {

    private selfieIK:SelfieIK;
    private sessionId:string;
    private animator:UnityEngine.Animator;

    Awake() {
        this.animator = this.GetComponent<UnityEngine.Animator>();
    }

    Start() {    

    }

    OnAnimatorIK () {
        this.StartAnimatorIK();
    }

    StartAnimatorIK() {
        if(!this.selfieIK?.isSelfie) return;

        const bodyWeight = ScreenShotModeManager.GetInstance().GetIKController().bodyWeight;
        const headWeight = ScreenShotModeManager.GetInstance().GetIKController().headWeight;

        const targetAtVector = ClientStarterV2.ParseVector3(this.selfieIK.targetAt);
        const lookAtVector = ClientStarterV2.ParseVector3(this.selfieIK.lookAt);

        this.animator.SetLookAtWeight(1, bodyWeight, headWeight);
        this.animator.SetLookAtPosition(lookAtVector);

        this.animator.SetIKPositionWeight(UnityEngine.AvatarIKGoal.RightHand, 1);
        this.animator.SetIKPosition(UnityEngine.AvatarIKGoal.RightHand, targetAtVector);
    }

    public Init(selfieIK:SelfieIK){
        this.selfieIK = selfieIK;
    }

}