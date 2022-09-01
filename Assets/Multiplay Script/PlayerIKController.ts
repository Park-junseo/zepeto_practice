import { ZepetoPlayer, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import ScreenShotModeManager from '../ScreenShotScripts/ScreenShotModeManager';
import ClientStarterV2 from './ClientStarterV2';
import * as UnityEngine from 'UnityEngine';
import { SelfieIK } from 'ZEPETO.Multiplay.Schema';
import IKController from '../ScreenShotScripts/IKController';

export default class PlayerIKController extends ZepetoScriptBehaviour {

    private selfieIK:SelfieIK;
    private sessionId:string;
    private animator:UnityEngine.Animator;
    private zepetoPlayer:ZepetoPlayer

    private selfieStick: UnityEngine.GameObject = undefined;

    Awake() {
        this.animator = this.GetComponent<UnityEngine.Animator>();
    }

    Start() {    
        ScreenShotModeManager.GetInstance().SetPlayerLayer(this.zepetoPlayer.character);
        this.selfieStick = ScreenShotModeManager.GetInstance().SetSelfieHand(this.zepetoPlayer.character, this.selfieStick);
    }

    OnAnimatorIK () {
        this.StartSelfieIK();
    }

    StartSelfieIK() {
        if(this.selfieStick === undefined)
            return;

        if(!this.selfieIK?.isSelfie) {
            this.selfieStick.SetActive(false);
            return;
        }
        this.selfieStick.SetActive(true);
        const bodyWeight = IKController.bodyWeight;
        const headWeight = IKController.headWeight;

        const targetAtVector = ClientStarterV2.ParseVector3(this.selfieIK.targetAt);
        const lookAtVector = ClientStarterV2.ParseVector3(this.selfieIK.lookAt);

        this.animator.SetLookAtWeight(1, bodyWeight, headWeight);
        this.animator.SetLookAtPosition(lookAtVector);

        this.animator.SetIKPositionWeight(UnityEngine.AvatarIKGoal.RightHand, 1);
        this.animator.SetIKPosition(UnityEngine.AvatarIKGoal.RightHand, targetAtVector);
    }

    public Init(zepetoPlayer:ZepetoPlayer, selfieIK:SelfieIK){
        this.zepetoPlayer = zepetoPlayer;
        this.selfieIK = selfieIK;
    }

}