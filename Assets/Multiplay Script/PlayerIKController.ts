import { ZepetoPlayer, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import ScreenShotModeManager from '../ScreenShotScripts/ScreenShotModeManager';
import ClientStarterV2 from './ClientStarterV2';
import * as UnityEngine from 'UnityEngine';
import { SelfieIK, Vector3 } from 'ZEPETO.Multiplay.Schema';
import IKController from '../ScreenShotScripts/IKController';
import SelfieStickController from '../ScreenShotScripts/SelfieStickController';

export default class PlayerIKController extends ZepetoScriptBehaviour {

    private selfieIK:SelfieIK;
    private sessionId:string;
    private animator:UnityEngine.Animator;
    private zepetoPlayer:ZepetoPlayer;
    private _isSelfie:boolean = false;

    private _lookAtVector:UnityEngine.Vector3;
    private _targetAtVector:UnityEngine.Vector3;

    private selfieStick: SelfieStickController = undefined;

    Awake() {
        this.animator = this.GetComponent<UnityEngine.Animator>();
    }

    Start() {    
        ScreenShotModeManager.Instance.SetPlayerLayer(this.zepetoPlayer.character);
        this.selfieStick = ScreenShotModeManager.Instance.SetSelfieHand(this.zepetoPlayer.character, this.selfieStick, this.sessionId);
    }

    OnDisable() {
        this.selfieStick.Disable();
    }

    OnAnimatorIK () {
        this.OnPlayerSelfieIK();
        this.OnPlayerSelfieWith();
    }

    OnPlayerSelfieIK() {
        if(this.selfieStick === undefined)
            return;

        if(!this.selfieIK?.isSelfie) {
            if(this._isSelfie) this.selfieStick.SetActive(false);
            this._isSelfie = false;
            return;
        }
        this._isSelfie = true;
        this.selfieStick.SetActive(true);
        const bodyWeight = IKController.bodyWeight;
        const headWeight = IKController.headWeight;

        this._targetAtVector = ClientStarterV2.ParseVector3(this.selfieIK.targetAt);
        this._lookAtVector = ClientStarterV2.ParseVector3(this.selfieIK.lookAt);

        this.animator.SetLookAtWeight(1, bodyWeight, headWeight);
        this.animator.SetLookAtPosition(this._lookAtVector);

        this.animator.SetIKPositionWeight(UnityEngine.AvatarIKGoal.RightHand, 1);
        this.animator.SetIKPosition(UnityEngine.AvatarIKGoal.RightHand, this._targetAtVector);
    }

    OnPlayerSelfieWith() {
        if(this.selfieIK?.selfieSession === '')
            return;
        
        const tempSelfieIK = ClientStarterV2.Instance.CurPlayerControlStates.get(this.selfieIK.selfieSession).selfieIK;

        if(!tempSelfieIK?.isSelfie)
            return;

        this._lookAtVector = ClientStarterV2.ParseVector3(tempSelfieIK.lookAt);

        this.animator.SetLookAtWeight(1, IKController.bodyLightWeight, IKController.headLightWeight);
        this.animator.SetLookAtPosition(this._lookAtVector);
    }

    public Init(zepetoPlayer:ZepetoPlayer, selfieIK:SelfieIK, sessionId:string): PlayerIKController{
        this.zepetoPlayer = zepetoPlayer;
        this.selfieIK = selfieIK;
        this.sessionId = sessionId;

        return this;
    }

    public get isSelfie() { return this._isSelfie; }
    public get targetAtVector() {return this._targetAtVector;}
    public get lookAtVector() {return this._lookAtVector;}

}