import { Camera, Canvas, GameObject, Quaternion, Sprite, Transform, Vector3, WaitForEndOfFrame } from 'UnityEngine';
import { UnityAction, UnityEvent } from 'UnityEngine.Events';
import { Button } from 'UnityEngine.UI';
import { ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import ClientStarterV2 from '../Multiplay Script/ClientStarterV2';
import ScreenShotModeManager from './ScreenShotModeManager';
import UIController from './UIController';

export default class SelfieStickController extends ZepetoScriptBehaviour {

    public static selfieUIEvent:UnityEvent = null;
    public static readonly uiDistance = 2;

    private isActive: boolean;
    private isActiveUI: boolean;
    private isLocal:boolean = false;

    private selfieUITrans:Transform;

    private isSelfieWith: boolean;

    private sessionId: string;

    private isFirst: boolean = true;
    
    @SerializeField()
    private selfieUI:Canvas;

    @SerializeField()
    private selfieButton: Button;

    private disabledSelfieWith:UnityAction = ()=>this.SetDisabledSelfieWith();

    Awake() {
        //this.selfieUI.gameObject.SetActive(false);
        this.selfieUITrans = this.selfieUI.transform;
    }

    // Start() {    
    //     this.SetActiveSelfieWith(false, true);
    // }

    private SetActiveSelfieWith(isSelfieWith:boolean) {
        if(isSelfieWith === this.isSelfieWith) return;

        if(isSelfieWith && SelfieStickController.selfieUIEvent !== null) {
            SelfieStickController.selfieUIEvent.Invoke();
        }

        this.isSelfieWith = isSelfieWith;
        if(this.isSelfieWith) {
            this.selfieButton.image.sprite = UIController.Instance.selfieGreenSprite;
        } else {
            this.selfieButton.image.sprite = UIController.Instance.selfieBlueSprite;
        }

        if(!this.isLocal && !this.isFirst) {
            ClientStarterV2.Instance.SendMessageSelfieWith(this.isSelfieWith, this.sessionId);
            ScreenShotModeManager.Instance.GetIKController().StartSelfieWith(this.isSelfieWith, this.sessionId);
        }

        if(!this.isLocal && this.isFirst) {
            console.log(`[SetActiveSelfieWith] first setting to ${isSelfieWith? 'on' : 'off'}`);
        }

        this.isFirst = false;
    }

    private SetDisabledSelfieWith() {
        this.SetActiveSelfieWith(false);

        console.log(`[SelfieStickController] ${this.sessionId}: off selfieUI count:${
            SelfieStickController.selfieUIEvent.GetPersistentEventCount()
        }`);
    }

    public SetActive(active:boolean) {
        if(this.isActive === active) return;
        this.isActive = active;
        this.gameObject.SetActive(active);
        this.SetActiveUI(active);
        if(this.isLocal && active) {
            if(SelfieStickController.selfieUIEvent !== null) {
                SelfieStickController.selfieUIEvent.Invoke();
            }
        }
    }

    private* SetUIRotattion() {
        //const lateUpdate = new WaitForEndOfFrame();
        // const cameraTrans = ZepetoPlayers.instance.ZepetoCamera.camera.transform;
        this.selfieUI.worldCamera = ZepetoPlayers.instance.ZepetoCamera.camera;
        while(this.isActiveUI) {
            // this.selfieUI.LookAt(cameraTrans);
            if(ZepetoPlayers.instance.LocalPlayer && 
            ZepetoPlayers.instance.ZepetoCamera?.gameObject.activeInHierarchy &&
            Vector3.Distance(ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.transform.position,this.transform.position) < SelfieStickController.uiDistance) {
                this.selfieUI.gameObject.SetActive(true);
                if(this.selfieUI.worldCamera) {
                    this.selfieUITrans.rotation = this.selfieUI.worldCamera.transform.rotation;
                }
            } else {
                this.selfieUI.gameObject.SetActive(false);
                this.SetActiveSelfieWith(false);
            }

            // this.selfieUI.rotation = Quaternion.Euler(Vector3.zero);
            yield null;
        }
        this.SetActiveSelfieWith(false);
    }

    public SetActiveUI(active:boolean) {
        if(this.isLocal || this.isActiveUI === active) return;
        this.isActiveUI = active;
        // this.selfieUI.gameObject.SetActive(active);
        if(active) {
            // this.SetSelfieIcon(this.isSelfieWith);
            this.StartCoroutine(this.SetUIRotattion());
        } else {
            this.SetActiveSelfieWith(false);
        }
    }

    public Init(isLocal:boolean, sessionId:string) {
        this.isLocal = isLocal;
        this.sessionId = sessionId;
        if(!isLocal) {
            // this.eventCamera = camera;

            this.selfieButton.onClick.AddListener(()=>{
                this.SetActiveSelfieWith(!this.isSelfieWith);
            });
            if(SelfieStickController.selfieUIEvent === null)
                SelfieStickController.selfieUIEvent = new UnityEvent();
            SelfieStickController.selfieUIEvent.AddListener(this.disabledSelfieWith);
        }
        this.SetActive(false);
    }

    public Disable() {
        if(!this.isLocal) {
            SelfieStickController.selfieUIEvent.RemoveListener(this.disabledSelfieWith);
            console.log(`[SelfieStickController] ${this.sessionId}: destroy remove listener count:${
                SelfieStickController.selfieUIEvent.GetPersistentEventCount()
            }`);
            // if(SelfieStickController.selfieUIEvent.GetPersistentEventCount() === 0) {
            //     SelfieStickController.selfieUIEvent.RemoveAllListeners();
            //     SelfieStickController.selfieUIEvent = null;
            // }
        }

    }

}