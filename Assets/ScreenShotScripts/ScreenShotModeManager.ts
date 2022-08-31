import { Animator, Camera, GameObject, Quaternion, Renderer, Transform, Vector3, Vector2 } from 'UnityEngine';
import { ZepetoCharacter, ZepetoPlayer, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import IKController from './IKController';
import ScreenShotController from './ScreenShotController';
import SelfieCamera from './SelfieCamera';

export default class ScreenShotModeManager extends ZepetoScriptBehaviour {
    
    private static Instance: ScreenShotModeManager;

    private localPlayer: ZepetoPlayer;
    private iKController: IKController;

    public screenShotController: GameObject;
    private screenShot: ScreenShotController;

    public selfieCameraPrefab: GameObject;
    private selfieCamera: SelfieCamera;
    private zepetoCamera: Camera;

    private _isActiveSelfie: boolean = false;

    public selfieStickPrefab: GameObject;
    private selfieStick: GameObject = undefined;

    // private lookAtTransform: Transform;
    // private targetTransform: Transform;

    // Data
    private playerLayer: number = 21;
    private _rightHandBone :string = "hand_R";

    Awake() {
        ScreenShotModeManager.Instance = this;
    }

    Start() {
        this.screenShot = this.screenShotController.GetComponent<ScreenShotController>();
        
        // Caching objects related to the Zepeto Local player
        ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
            this.localPlayer = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer;
            this.zepetoCamera = ZepetoPlayers.instance.LocalPlayer.zepetoCamera.camera;

            // if(this.localPlayer.character.gameObject.layer != this.playerLayer) {
            //     this.localPlayer.character.GetComponentsInChildren<Transform>().forEach((characterObj) => {
            //         characterObj.gameObject.layer = this.playerLayer;
            //     });
            // }   
            this.SetPlayerLayer(this.localPlayer.character);
            // this.SetSelfieHand(this.localPlayer.character, this.selfieStick);

            
            if(!this.iKController) {
                let playerAnimator = this.localPlayer.character.gameObject.GetComponentInChildren<Animator>();
                this.iKController = playerAnimator.gameObject.AddComponent<IKController>();
            }
        });
    }

    // Proceed with the specified settings when entering screenshot mode. 
    public StartScreenShotMode() {
        // 1. IK Settings
        this.selfieCamera = this.selfieCamera || GameObject.Instantiate<GameObject>(this.selfieCameraPrefab).GetComponent<SelfieCamera>();
        this.selfieCamera.transform.parent = ZepetoPlayers.instance.ZepetoCamera.transform;

        let character = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;
  
        // 2. SelfieCamera setting
        
        let grip = this.selfieCamera.GetGripObject();

        // this.lookAtTransform = this.lookAtTransform || new GameObject("selfieLookAt").transform;
        // this.lookAtTransform.SetPositionAndRotation(this.selfieCamera.transform.position, this.selfieCamera.transform.rotation);
        // this.lookAtTransform.parent = character.transform;

        // this.targetTransform = this.targetTransform || new GameObject("target").transform;


        this.selfieCamera.InitSetting(character);

        this.iKController.SetTargetAndGrip(this.selfieCamera.transform, grip.transform, character.transform);

        // 3. Fix the selfie stick on the character's right hand
        // this.selfieStick = this.selfieStick || GameObject.Instantiate<GameObject>(this.selfieStickPrefab);
        // this.localPlayer.character.GetComponentsInChildren<Transform>().forEach((characterObj) => {
        //     if(characterObj.name == this._rightHandBone) {
        //         this.selfieStick.transform.parent = characterObj;
        //         this.selfieStick.transform.localPosition = Vector3.zero;
        //         this.selfieStick.transform.localRotation = Quaternion.Euler(Vector3.zero);
        //         this.selfieStick.GetComponentInChildren<Renderer>().gameObject.layer = this.playerLayer;
        //     }
        // });
        this.selfieStick = this.SetSelfieHand(this.localPlayer.character, this.selfieStick);
        console.log(`[SetSelfieHand] ${this.selfieStick?.name}`)
        // 4. Initialize the zepetoCamera
        //this.SetZepetoCameraMode();

        this.screenShot.GetUIController().SettingScreenShotMode();
    }

    public SetPlayerLayer (character:ZepetoCharacter) {
        if(character.gameObject.layer != this.playerLayer) {
            character.GetComponentsInChildren<Transform>().forEach((characterObj) => {
                characterObj.gameObject.layer = this.playerLayer;
            });
        }   
    }

    public SetSelfieHand(character:ZepetoCharacter, selfieStick: GameObject) :GameObject {
        if(!character) return;

        selfieStick = selfieStick || GameObject.Instantiate<GameObject>(this.selfieStickPrefab);
        
        character.GetComponentsInChildren<Transform>().forEach((characterObj) => {
            if(characterObj.name == this._rightHandBone) {
                selfieStick.transform.parent = characterObj;
                selfieStick.transform.localPosition = Vector3.zero;
                selfieStick.transform.localRotation = Quaternion.Euler(Vector3.zero);
                selfieStick.GetComponentInChildren<Renderer>().gameObject.layer = this.playerLayer;
                selfieStick.SetActive(false);
            }
        });

        return selfieStick;
    }

   
    // Initialize the camera settings when exiting the screenshot mode.
    public ExitScreenShotMode(isThirdPersonView: boolean) {
        if(this.selfieCamera != null) {
            //GameObject.Destroy(this.selfieCamera.gameObject);
            // this.selfieCamera.gameObject.SetActive(false);
            this.selfieCamera.SetActiveCam(false);
        }

        // Delete the selfie camera
        // Disable IK Pass
        this.SetIKPassActive(false);
        // Activate ZEPETO Camera
        this.SetZepetoCameraActive(true);

        if(isThirdPersonView) {
            //ZepetoPlayers.instance.ZepetoCamera.rotation.SetLookRotation(Vector3.zero);//.cameraParent.eulerAngles = Vector3.forward;
            //ZepetoPlayers.instance.ZepetoCamera.rotation.SetLookRotation(Vector3.zero);
            ZepetoPlayers.instance.ZepetoCamera.cameraParent.rotation = Quaternion.Euler(Vector3.zero);
        }

        this._isActiveSelfie = false;
    }

    public GetPlayerLayer(): number {
        return this.playerLayer;
    }
    // Return Selfie Camera
    public GetSelfieCamera(): Camera {
        return this.selfieCamera.GetCamera();
    }
    // Return ZEPETO Camera
    public GetZepetoCamera(): Camera {
        return this.zepetoCamera;
    }

    // Decide whether to enable the selfie camera
    public SetSelfieCameraActive(active: boolean) {
        this.selfieCamera.SetActiveCam(active);
    }

    // Decide whether to apply IKPass
    public SetIKPassActive(active: boolean) {
        this.iKController.SetIKWeightActive(active);
        //Selfie stick is enable/disable at the same time IK controller is used in selfie mode. 
        this.selfieStick.SetActive(active);
    }

    // Functions for camera setup
    SetSelfieCameraMode() {
        //Disable the existing ZEPETO Camera
        this.SetZepetoCameraActive(false);
        // Enable Selfie Camera
        this.SetSelfieCameraActive(true);
        // Enabling IKPass for Selfie Pose Settings
        this.SetIKPassActive(true); 
        //Change the camera for screenshots to the selfie camera
        this.screenShot.SetScreenShotCamera(this.selfieCamera.GetCamera());
        // Enable Selfie Stick
        this.selfieStick.SetActive(true);

        this._isActiveSelfie = true;
    }

    SetZepetoCameraMode() {
        //Activate the current ZEPETO camera
        this.SetZepetoCameraActive(true);
        // Disable Selfie Camera
        this.SetSelfieCameraActive(false);
        //Disable IKPass to stop posing for selfies
        this.SetIKPassActive(false);
        //Change the active camera to the ZEPETO camera
        this.screenShot.SetScreenShotCamera(this.zepetoCamera);
        // Disable the selfie stick
        this.selfieStick.SetActive(false);

        this._isActiveSelfie = false;
    }

    private SetZepetoCameraActive(active:boolean) {
        this.zepetoCamera.gameObject.SetActive(active);
        //ZepetoPlayers.instance.ZepetoCamera.enabled = active;
        ZepetoPlayers.instance.ZepetoCamera.LockXAxis = !active;
    }

    public static GetInstance(): ScreenShotModeManager {
        if(!ScreenShotModeManager.Instance) {

            var _obj = new GameObject("ClientStarter");
            GameObject.DontDestroyOnLoad(_obj);
            ScreenShotModeManager.Instance = _obj.AddComponent<ScreenShotModeManager>();
        }

        return ScreenShotModeManager.Instance;
    }

    public GetIKController() { return this.iKController; }

    public get isActiveSelfie() { return this._isActiveSelfie; }

    public get rightHandBone() {return this._rightHandBone;}
}
